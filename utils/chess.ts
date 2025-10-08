import { ChessPiece, PieceType, PieceColor, Square, GameState, Position, Move } from '../types';

export const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
  black: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' }
};

export const squareToPosition = (square: Square): Position => {
  const col = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(square.charAt(1), 10);
  return { row, col };
};

export const positionToSquare = (position: Position): Square => {
  return `${String.fromCharCode('a'.charCodeAt(0) + position.col)}${8 - position.row}` as Square;
};

export const createInitialBoard = (): (ChessPiece | null)[][] => {
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  const placePiece = (pos: Square, piece: ChessPiece) => {
    const { row, col } = squareToPosition(pos);
    board[row][col] = piece;
  };

  const backRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  for (let i = 0; i < 8; i++) {
    const file = String.fromCharCode('a'.charCodeAt(0) + i);
    placePiece(`${file}1`, { type: backRank[i], color: 'white' });
    placePiece(`${file}2`, { type: 'pawn', color: 'white' });
    placePiece(`${file}7`, { type: 'pawn', color: 'black' });
    placePiece(`${file}8`, { type: backRank[i], color: 'black' });
  }

  return board;
};

export const createInitialGameState = (): GameState => ({
  board: createInitialBoard(),
  currentPlayer: 'white',
  moveHistory: [],
  castlingRights: { whiteKingside: true, whiteQueenside: true, blackKingside: true, blackQueenside: true },
  enPassantTarget: null,
  halfMoveClock: 0,
  fullMoveNumber: 1,
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  isGameOver: false,
});

export const isSquareAttacked = (board: (ChessPiece | null)[][], square: Square, byColor: PieceColor): boolean => {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color === byColor) {
                const fromSquare = positionToSquare({ row: r, col: c });
                // We use a simplified move generation here that only cares about captures
                const moves = getPieceMoves(board, fromSquare, piece, { whiteKingside: false, whiteQueenside: false, blackKingside: false, blackQueenside: false }, null, true);
                if (moves.some(move => move.to === square)) {
                    return true;
                }
            }
        }
    }
    return false;
};

export const getPieceMoves = (
  board: (ChessPiece | null)[][],
  square: Square,
  piece: ChessPiece,
  castlingRights: GameState['castlingRights'],
  enPassantTarget: Square | null,
  ignoreKingCheck: boolean = false
): Move[] => {
  const { type } = piece;
  switch (type) {
    case 'pawn': return getPawnMoves(board, square, piece.color, enPassantTarget);
    case 'rook': return getSlidingMoves(board, square, piece.color, [[0, 1], [0, -1], [1, 0], [-1, 0]]);
    case 'knight': return getKnightMoves(board, square, piece.color);
    case 'bishop': return getSlidingMoves(board, square, piece.color, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
    case 'queen': return getSlidingMoves(board, square, piece.color, [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
    case 'king': return getKingMoves(board, square, piece.color, castlingRights, ignoreKingCheck);
    default: return [];
  }
};

const getPawnMoves = (board: (ChessPiece | null)[][], from: Square, color: PieceColor, enPassantTarget: Square | null): Move[] => {
  const moves: Move[] = [];
  const { row, col } = squareToPosition(from);
  const piece = board[row][col]!;
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;
  const opponentColor = color === 'white' ? 'black' : 'white';

  // 1. Forward move
  if (row + direction >= 0 && row + direction < 8 && !board[row + direction][col]) {
    const to = positionToSquare({ row: row + direction, col });
    moves.push({ from, to, piece, promotion: (row + direction === 0 || row + direction === 7) ? 'queen' : undefined });
    // 2. Double move
    if (row === startRow && !board[row + 2 * direction][col]) {
      const to2 = positionToSquare({ row: row + 2 * direction, col });
      moves.push({ from, to: to2, piece });
    }
  }

  // 3. Captures
  [-1, 1].forEach(dCol => {
    if (col + dCol >= 0 && col + dCol < 8) {
      const targetRow = row + direction;
      const targetCol = col + dCol;
      const targetPiece = board[targetRow]?.[targetCol];
      // Normal capture
      if (targetPiece && targetPiece.color === opponentColor) {
        const to = positionToSquare({ row: targetRow, col: targetCol });
        moves.push({ from, to, piece, captured: targetPiece, promotion: (targetRow === 0 || targetRow === 7) ? 'queen' : undefined });
      }
      // En passant
      const enPassantPos = enPassantTarget ? squareToPosition(enPassantTarget) : null;
      if (enPassantPos && enPassantPos.row === targetRow && enPassantPos.col === targetCol) {
        const to = positionToSquare({ row: targetRow, col: targetCol });
        const capturedPawnPos = { row, col: targetCol };
        moves.push({ from, to, piece, captured: board[capturedPawnPos.row][capturedPawnPos.col], enPassant: true });
      }
    }
  });

  return moves;
};

const getSlidingMoves = (board: (ChessPiece | null)[][], from: Square, color: PieceColor, directions: number[][]): Move[] => {
  const moves: Move[] = [];
  const { row, col } = squareToPosition(from);
  const piece = board[row][col]!;

  for (const [dr, dc] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dr;
      const newCol = col + i * dc;
      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;

      const targetPiece = board[newRow][newCol];
      if (targetPiece) {
        if (targetPiece.color !== color) {
          moves.push({ from, to: positionToSquare({ row: newRow, col: newCol }), piece, captured: targetPiece });
        }
        break;
      }
      moves.push({ from, to: positionToSquare({ row: newRow, col: newCol }), piece });
    }
  }
  return moves;
};

const getKnightMoves = (board: (ChessPiece | null)[][], from: Square, color: PieceColor): Move[] => {
  const moves: Move[] = [];
  const { row, col } = squareToPosition(from);
  const piece = board[row][col]!;
  const deltas = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];

  for (const [dr, dc] of deltas) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || targetPiece.color !== color) {
        moves.push({ from, to: positionToSquare({ row: newRow, col: newCol }), piece, captured: targetPiece || undefined });
      }
    }
  }
  return moves;
};

const getKingMoves = (board: (ChessPiece | null)[][], from: Square, color: PieceColor, castlingRights: GameState['castlingRights'], ignoreKingCheck: boolean = false): Move[] => {
  const moves: Move[] = [];
  const { row, col } = squareToPosition(from);
  const piece = board[row][col]!;
  const opponentColor = color === 'white' ? 'black' : 'white';

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = board[newRow][newCol];
        if (!targetPiece || targetPiece.color !== color) {
          moves.push({ from, to: positionToSquare({ row: newRow, col: newCol }), piece, captured: targetPiece || undefined });
        }
      }
    }
  }
  
  // Castling
  if (!ignoreKingCheck && !isSquareAttacked(board, from, opponentColor)) {
      if(color === 'white') {
          if (castlingRights.whiteKingside && !board[7][5] && !board[7][6] && !isSquareAttacked(board, 'f1', opponentColor) && !isSquareAttacked(board, 'g1', opponentColor)) {
            moves.push({ from, to: 'g1', piece, castling: 'kingside' });
          }
          if (castlingRights.whiteQueenside && !board[7][1] && !board[7][2] && !board[7][3] && !isSquareAttacked(board, 'd1', opponentColor) && !isSquareAttacked(board, 'c1', opponentColor)) {
            moves.push({ from, to: 'c1', piece, castling: 'queenside' });
          }
      } else {
          if (castlingRights.blackKingside && !board[0][5] && !board[0][6] && !isSquareAttacked(board, 'f8', opponentColor) && !isSquareAttacked(board, 'g8', opponentColor)) {
            moves.push({ from, to: 'g8', piece, castling: 'kingside' });
          }
          if (castlingRights.blackQueenside && !board[0][1] && !board[0][2] && !board[0][3] && !isSquareAttacked(board, 'd8', opponentColor) && !isSquareAttacked(board, 'c8', opponentColor)) {
            moves.push({ from, to: 'c8', piece, castling: 'queenside' });
          }
      }
  }

  return moves;
};

export const findKing = (board: (ChessPiece | null)[][], color: PieceColor): Square | null => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'king' && piece.color === color) {
        return positionToSquare({ row: r, col: c });
      }
    }
  }
  return null;
};

export const applyMove = (gameState: GameState, move: Move): GameState => {
  const newBoard = gameState.board.map(r => [...r]);
  const fromPos = squareToPosition(move.from);
  const toPos = squareToPosition(move.to);

  newBoard[fromPos.row][fromPos.col] = null;
  newBoard[toPos.row][toPos.col] = move.promotion ? { ...move.piece, type: move.promotion } : move.piece;

  if (move.enPassant) {
    const capturedPawnRow = fromPos.row;
    const capturedPawnCol = toPos.col;
    newBoard[capturedPawnRow][capturedPawnCol] = null;
  }
  
  if (move.castling) {
      if (move.castling === 'kingside') {
          const rook = newBoard[toPos.row][7];
          newBoard[toPos.row][7] = null;
          newBoard[toPos.row][5] = rook;
      } else { // queenside
          const rook = newBoard[toPos.row][0];
          newBoard[toPos.row][0] = null;
          newBoard[toPos.row][3] = rook;
      }
  }
  
  const newCastlingRights = { ...gameState.castlingRights };
  if (move.piece.type === 'king') {
      if (move.piece.color === 'white') {
          newCastlingRights.whiteKingside = false;
          newCastlingRights.whiteQueenside = false;
      } else {
          newCastlingRights.blackKingside = false;
          newCastlingRights.blackQueenside = false;
      }
  }
  if (move.from === 'a1' || move.to === 'a1') newCastlingRights.whiteQueenside = false;
  if (move.from === 'h1' || move.to === 'h1') newCastlingRights.whiteKingside = false;
  if (move.from === 'a8' || move.to === 'a8') newCastlingRights.blackQueenside = false;
  if (move.from === 'h8' || move.to === 'h8') newCastlingRights.blackKingside = false;

  let newEnPassantTarget: Square | null = null;
  if (move.piece.type === 'pawn' && Math.abs(fromPos.row - toPos.row) === 2) {
      newEnPassantTarget = positionToSquare({ row: (fromPos.row + toPos.row) / 2, col: fromPos.col });
  }

  const halfMoveClock = move.piece.type === 'pawn' || move.captured ? 0 : gameState.halfMoveClock + 1;
  const fullMoveNumber = gameState.currentPlayer === 'black' ? gameState.fullMoveNumber + 1 : gameState.fullMoveNumber;
  
  return {
    ...gameState,
    board: newBoard,
    currentPlayer: gameState.currentPlayer === 'white' ? 'black' : 'white',
    moveHistory: [...gameState.moveHistory, move],
    castlingRights: newCastlingRights,
    enPassantTarget: newEnPassantTarget,
    halfMoveClock,
    fullMoveNumber,
  };
};

export const getAllValidMoves = (state: GameState, color: PieceColor): Move[] => {
  const allMoves: Move[] = [];
  const opponentColor = color === 'white' ? 'black' : 'white';

  for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
          const piece = state.board[r][c];
          if (piece && piece.color === color) {
              const fromSquare = positionToSquare({ row: r, col: c });
              const pieceMoves = getPieceMoves(state.board, fromSquare, piece, state.castlingRights, state.enPassantTarget);
              
              for (const move of pieceMoves) {
                  const tempState = applyMove(state, move);
                  const kingSquare = findKing(tempState.board, color);
                  if (kingSquare && !isSquareAttacked(tempState.board, kingSquare, opponentColor)) {
                      allMoves.push(move);
                  }
              }
          }
      }
  }
  return allMoves;
};