
import { GameState, Move, PieceType, PieceColor, ChessPiece, Square } from '../types';
import { getAllValidMoves, applyMove } from '../utils/chess';

export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000
};

// Piece-Square Tables for positional evaluation
const pawnTable = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const knightTable = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

// ... (similar tables for bishop, rook, queen, king)
const kingTable = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20]
];


const pieceSquareTables: Record<PieceType, number[][]> = {
    pawn: pawnTable,
    knight: knightTable,
    bishop: knightTable.map(row => row.map(val => val + 5).reverse()), // Bishops are similar to knights but mirrored
    rook: pawnTable.map(row => row.map(val => val / 10)), // Simplified rook table
    queen: pawnTable.map(row => row.map(val => val / 5)), // Simplified queen table
    king: kingTable
};

const evaluatePosition = (gameState: GameState): number => {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = gameState.board[r][c];
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        const table = pieceSquareTables[piece.type];
        const positionalValue = piece.color === 'white' ? table[r][c] : table[7-r][c];
        score += (value + positionalValue) * (piece.color === 'white' ? 1 : -1);
      }
    }
  }
  // Add some randomness
  score += Math.random() * 10 - 5;
  return score;
};

const minimax = (gameState: GameState, depth: number, isMaximizing: boolean, alpha: number, beta: number): number => {
    if (depth === 0 || gameState.isGameOver) {
        if (gameState.isCheckmate) return isMaximizing ? -Infinity : Infinity;
        if (gameState.isStalemate) return 0;
        return evaluatePosition(gameState);
    }

    const moves = getAllValidMoves(gameState, gameState.currentPlayer);

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const childState = applyMove(gameState, move);
            const evaluation = minimax(childState, depth - 1, false, alpha, beta);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const childState = applyMove(gameState, move);
            const evaluation = minimax(childState, depth - 1, true, alpha, beta);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

export const getBestMove = (gameState: GameState, depth: number): Move | null => {
    const moves = getAllValidMoves(gameState, gameState.currentPlayer);
    if (moves.length === 0) return null;

    let bestMove: Move | null = null;
    let bestValue = gameState.currentPlayer === 'white' ? -Infinity : Infinity;
    
    // Randomize move order to avoid deterministic play
    moves.sort(() => Math.random() - 0.5);

    for (const move of moves) {
        const childState = applyMove(gameState, move);
        const isMaximizing = gameState.currentPlayer === 'black'; // AI is black, so it is the minimizing player. Its first move choice is maximizing for the opponent.
        const moveValue = minimax(childState, depth - 1, isMaximizing, -Infinity, Infinity);
        
        if (gameState.currentPlayer === 'white') {
            if (moveValue > bestValue) {
                bestValue = moveValue;
                bestMove = move;
            }
        } else { // Black's turn (minimizing)
            if (moveValue < bestValue) {
                bestValue = moveValue;
                bestMove = move;
            }
        }
    }
    return bestMove || moves[0];
};
