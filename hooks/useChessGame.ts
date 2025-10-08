
import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, Move, PieceColor, Square, PieceType } from '../types';
import { createInitialGameState, getPieceMoves, positionToSquare, squareToPosition, isSquareAttacked, findKing, applyMove, getAllValidMoves } from '../utils/chess';
import { getBestMove } from '../services/chessEngine';

export const useChessGame = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
  const [aiIsThinking, setAiIsThinking] = useState<boolean>(false);
  const [promotionMove, setPromotionMove] = useState<Move | null>(null);
  
  const validMoves = useMemo(() => {
    if (!selectedPiece || promotionMove) return [];
    const pos = squareToPosition(selectedPiece);
    const piece = gameState.board[pos.row][pos.col];
    if (!piece || piece.color !== gameState.currentPlayer) return [];
    
    const allMoves = getPieceMoves(gameState.board, selectedPiece, piece, gameState.castlingRights, gameState.enPassantTarget);
    
    // Filter out moves that would leave the king in check
    return allMoves.filter(move => {
      const tempState = applyMove(gameState, move);
      const kingSquare = findKing(tempState.board, gameState.currentPlayer);
      return kingSquare ? !isSquareAttacked(tempState.board, kingSquare, gameState.currentPlayer === 'white' ? 'black' : 'white') : true;
    });
  }, [selectedPiece, gameState, promotionMove]);
  
  const checkGameStatus = useCallback((state: GameState): GameState => {
    const nextPlayer = state.currentPlayer;
    const opponentColor = nextPlayer === 'white' ? 'black' : 'white';
    const kingSquare = findKing(state.board, nextPlayer);
    
    if (!kingSquare) return { ...state, isGameOver: true, isCheckmate: true };

    const inCheck = isSquareAttacked(state.board, kingSquare, opponentColor);
    const hasValidMoves = getAllValidMoves(state, nextPlayer).length > 0;

    const isCheckmate = inCheck && !hasValidMoves;
    const isStalemate = !inCheck && !hasValidMoves;
    const isGameOver = isCheckmate || isStalemate;

    return { ...state, isCheck: inCheck, isCheckmate, isStalemate, isGameOver };
  }, []);
  
  const makeMove = useCallback((move: Move) => {
    if (gameState.isGameOver) return;
    
    let newState = applyMove(gameState, move);
    newState = checkGameStatus(newState);
    
    setGameState(newState);
    setSelectedPiece(null);
  }, [gameState, checkGameStatus]);
  
  const handleSquareClick = useCallback((square: Square) => {
    if (gameState.isGameOver || gameState.currentPlayer === 'black' || promotionMove) return;
    
    if (selectedPiece === square) {
      setSelectedPiece(null);
      return;
    }

    const pos = squareToPosition(square);
    const piece = gameState.board[pos.row][pos.col];

    if (selectedPiece) {
      const move = validMoves.find(m => m.to === square);
      if (move) {
        if (move.promotion && gameState.currentPlayer === 'white') {
          setPromotionMove(move);
          setSelectedPiece(null);
        } else {
          makeMove(move);
        }
      } else {
        if (piece && piece.color === gameState.currentPlayer) {
          setSelectedPiece(square);
        } else {
          setSelectedPiece(null);
        }
      }
    } else {
      if (piece && piece.color === gameState.currentPlayer) {
        setSelectedPiece(square);
      }
    }
  }, [gameState, selectedPiece, validMoves, makeMove, promotionMove]);
  
  const handlePromotionChoice = useCallback((pieceType: PieceType) => {
    if (!promotionMove) return;
    const finalMove: Move = {
        ...promotionMove,
        promotion: pieceType,
    };
    makeMove(finalMove);
    setPromotionMove(null);
  }, [promotionMove, makeMove]);

  const newGame = useCallback(() => {
    setGameState(createInitialGameState());
    setSelectedPiece(null);
    setAiIsThinking(false);
    setPromotionMove(null);
  }, []);

  const undoMove = useCallback(() => {
     if(gameState.moveHistory.length < 2) return;

     let tempState = createInitialGameState();
     const historyToReplay = gameState.moveHistory.slice(0, -2);
     
     historyToReplay.forEach(move => {
        tempState = applyMove(tempState, move);
     });
     
     tempState = checkGameStatus(tempState);
     setGameState(tempState);
     setSelectedPiece(null);
     setPromotionMove(null);

  }, [gameState.moveHistory, checkGameStatus]);

  useEffect(() => {
    if (gameState.currentPlayer === 'black' && !gameState.isGameOver) {
      setAiIsThinking(true);
      const timer = setTimeout(() => {
        const aiMove = getBestMove(gameState, 3); // Depth 3 for ~1500 ELO
        if (aiMove) {
          makeMove(aiMove);
        }
        setAiIsThinking(false);
      }, 500); // Small delay for UX
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPlayer, gameState.isGameOver, makeMove]);

  return {
    gameState,
    selectedPiece,
    validMoves,
    aiIsThinking,
    promotionMove,
    handleSquareClick,
    newGame,
    undoMove,
    handlePromotionChoice,
  };
};
