import React from 'react';
import { GameState, ChessPiece, PieceColor, PieceType } from '../types';
import { PIECE_SYMBOLS } from '../utils/chess';
import { NewGameIcon } from './icons/NewGameIcon';
import { UndoIcon } from './icons/UndoIcon';

interface GameInfoProps {
  gameState: GameState;
  onNewGame: () => void;
  onUndo: () => void;
  aiIsThinking: boolean;
}

const CapturedPieces: React.FC<{ pieces: ChessPiece[] }> = ({ pieces }) => {
    const pieceValues: Record<PieceType, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
    const sortedPieces = [...pieces].sort((a, b) => pieceValues[b.type] - pieceValues[a.type]);
  
    return (
      <div className="flex flex-wrap gap-1 min-h-[2rem]">
        {sortedPieces.map((piece, index) => {
          const pieceColor = piece.color;
          return (
            <span
              key={index}
              className={`text-2xl ${pieceColor === 'white' ? 'text-white' : 'text-black'}`}
              title={piece.type}
              style={{
                textShadow: pieceColor === 'white'
                  ? '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                  : '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff'
              }}
            >
              {PIECE_SYMBOLS[pieceColor][piece.type]}
            </span>
          );
        })}
      </div>
    );
};

const GameInfo: React.FC<GameInfoProps> = ({ gameState, onNewGame, onUndo, aiIsThinking }) => {
  const { currentPlayer, moveHistory, board } = gameState;

  const getCapturedPieces = (color: PieceColor): ChessPiece[] => {
    const initialCounts: Record<PieceType, number> = { pawn: 8, rook: 2, knight: 2, bishop: 2, queen: 1, king: 1 };
    const currentCounts: Record<PieceType, number> = { pawn: 0, rook: 0, knight: 0, bishop: 0, queen: 0, king: 0 };
    
    board.flat().forEach(piece => {
      if (piece && piece.color === color) {
        currentCounts[piece.type]++;
      }
    });

    const captured: ChessPiece[] = [];
    for (const type in initialCounts) {
      const pieceType = type as PieceType;
      const capturedCount = initialCounts[pieceType] - currentCounts[pieceType];
      for (let i = 0; i < capturedCount; i++) {
        captured.push({ type: pieceType, color });
      }
    }
    return captured;
  };

  const whiteCaptured = getCapturedPieces('white');
  const blackCaptured = getCapturedPieces('black');

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-stone-700/50 p-3 rounded-lg text-center">
        <h2 className="text-lg font-bold text-stone-300">Current Turn</h2>
        <div className="text-2xl font-bold mt-1 transition-colors duration-300">
          {aiIsThinking ? (
            <span className="text-yellow-400 animate-pulse">AI is thinking...</span>
          ) : (
            <span
              className={currentPlayer === 'white' ? 'text-white' : 'text-black'}
              style={currentPlayer === 'black' ? { textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' } : {}}
            >
              {currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}
            </span>
          )}
        </div>
      </div>
      
      <div className="bg-stone-700/50 p-3 rounded-lg flex-grow">
        <h2 className="text-lg font-bold text-stone-300 mb-2">Move History</h2>
        <div className="h-48 bg-stone-900/70 rounded p-2 overflow-y-auto text-sm">
          <ol className="list-decimal list-inside">
            {moveHistory.reduce((acc, move, index) => {
              if (index % 2 === 0) {
                const whiteMove = move;
                const blackMove = moveHistory[index + 1];
                acc.push(
                  <li key={index / 2} className="grid grid-cols-2 gap-2 mb-1">
                    <span>{whiteMove.piece.type.charAt(0).toUpperCase()}{whiteMove.to}</span>
                    {blackMove && <span>{blackMove.piece.type.charAt(0).toUpperCase()}{blackMove.to}</span>}
                  </li>
                );
              }
              return acc;
            }, [] as React.ReactElement[])}
          </ol>
        </div>
      </div>
      
      <div className="bg-stone-700/50 p-3 rounded-lg">
        <h2 className="text-lg font-bold text-stone-300 mb-2">Captured Pieces</h2>
        <div className="space-y-2">
            <div>
                <span className="font-semibold text-white">White:</span>
                <CapturedPieces pieces={blackCaptured} />
            </div>
            <div>
                <span
                  className="font-semibold text-black"
                  style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}
                >
                  Black:
                </span>
                <CapturedPieces pieces={whiteCaptured} />
            </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onNewGame}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 flex items-center justify-center gap-2"
        >
          <NewGameIcon className="w-5 h-5"/>
          New Game
        </button>
        <button
          onClick={onUndo}
          disabled={moveHistory.length < 2}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          <UndoIcon className="w-5 h-5"/>
          Undo
        </button>
      </div>
    </div>
  );
};

export default GameInfo;