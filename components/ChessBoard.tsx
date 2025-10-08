import React from 'react';
import { ChessPiece, Square, Move, PieceType } from '../types';
import { PIECE_SYMBOLS } from '../utils/chess';

interface ChessBoardProps {
  board: (ChessPiece | null)[][];
  onSquareClick: (square: Square) => void;
  selectedSquare: Square | null;
  validMoves: Move[];
  lastMove?: Move;
  promotionMove: Move | null;
  onPromotionChoice: (pieceType: PieceType) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ board, onSquareClick, selectedSquare, validMoves, lastMove, promotionMove, onPromotionChoice }) => {
  const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const rowsReversed = [...rows].reverse();

  const validMoveSquares = validMoves.map(move => move.to);

  const SquareContent: React.FC<{rowIndex: number, colIndex: number}> = ({rowIndex, colIndex}) => {
    const square: Square = `${cols[colIndex]}${rows[rowIndex]}`;
    const piece = board[rowIndex][colIndex];
    const isLight = (rowIndex + colIndex) % 2 === 0;
    const isSelected = square === selectedSquare;
    const isValidMove = validMoveSquares.includes(square);
    const isLastMove = lastMove && (square === lastMove.from || square === lastMove.to);

    const highlightClass = isSelected 
      ? 'bg-green-500/50' 
      : isLastMove 
      ? 'bg-yellow-500/40' 
      : '';

    return (
      <div
        className={`relative w-full h-full flex items-center justify-center cursor-pointer group`}
        style={{ backgroundColor: isLight ? '#f0d9b5' : '#b58863' }}
        onClick={() => onSquareClick(square)}
        aria-label={`Square ${square}`}
      >
        <div className={`absolute inset-0 transition-colors duration-200 ${highlightClass}`}></div>

        {/* Valid move indicator */}
        {isValidMove && (
          <div className="absolute w-full h-full flex items-center justify-center">
            {board[rowIndex][colIndex] 
              ? <div className="w-full h-full rounded-full ring-8 ring-black/20"></div>
              : <div className="w-1/3 h-1/3 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.25) 50%, transparent 55%)' }}></div>
            }
          </div>
        )}
        
        {piece && (
          <span
            className={`
              chess-piece z-10
              text-4xl sm:text-5xl
              font-black
              transition-transform duration-200 
              ${piece.color === 'white' ? 'text-white' : 'text-black'}
              group-hover:scale-110
            `}
            style={{
              textShadow: piece.color === 'white'
                ? '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                : '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff'
            }}
            aria-label={`${piece.color} ${piece.type}`}
          >
            {PIECE_SYMBOLS[piece.color][piece.type]}
          </span>
        )}
      </div>
    );
  };
  
  const Coords: React.FC<{items: string[], isHorizontal: boolean}> = ({ items, isHorizontal }) => (
     <div className={`
        flex 
        ${isHorizontal ? 'flex-row w-full justify-around' : 'flex-col h-full justify-around'}
        text-xs font-bold text-amber-200/70 pointer-events-none select-none
     `}>
        {items.map(item => <span key={item}>{item}</span>)}
    </div>
  );

  return (
    <div className="relative aspect-square w-full shadow-2xl rounded-lg bg-[#4a2e1a] p-2 sm:p-4 flex flex-col gap-1">
      {promotionMove && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20" aria-modal="true" role="dialog">
          <div className="bg-amber-800 p-4 rounded-lg shadow-2xl">
            <h3 className="text-center text-xl font-bold text-yellow-300 mb-4">Promote Pawn</h3>
            <div className="flex gap-4">
              {(['queen', 'rook', 'bishop', 'knight'] as PieceType[]).map(pieceType => {
                const piece = { type: pieceType, color: promotionMove.piece.color };
                return (
                  <button
                    key={pieceType}
                    onClick={() => onPromotionChoice(pieceType)}
                    className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-amber-700 hover:bg-amber-600 rounded-md transition-colors duration-200"
                    aria-label={`Promote to ${pieceType}`}
                  >
                    <span 
                      className={`text-5xl font-black ${piece.color === 'white' ? 'text-white' : 'text-black'}`}
                      style={{
                          textShadow: piece.color === 'white'
                          ? '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                          : '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff'
                      }}
                    >
                      {PIECE_SYMBOLS[piece.color][piece.type]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <Coords items={cols} isHorizontal={true} />
      <div className="flex flex-1 gap-1">
        <Coords items={rows} isHorizontal={false} />
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full aspect-square shadow-inner overflow-hidden">
          {board.map((row, rowIndex) =>
            row.map((_, colIndex) => (
              <SquareContent key={`${rowIndex}-${colIndex}`} rowIndex={rowIndex} colIndex={colIndex} />
            ))
          )}
        </div>
        <Coords items={rows} isHorizontal={false} />
      </div>
      <Coords items={cols} isHorizontal={true} />
    </div>
  );
};

export default ChessBoard;
