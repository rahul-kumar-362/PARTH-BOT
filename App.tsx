import React from 'react';
import ChessBoard from './components/ChessBoard';
import GameInfo from './components/GameInfo';
import { useChessGame } from './hooks/useChessGame';
import { CrownIcon } from './components/icons/CrownIcon';

const App: React.FC = () => {
  const {
    gameState,
    selectedPiece,
    validMoves,
    handleSquareClick,
    newGame,
    undoMove,
    aiIsThinking,
    promotionMove,
    handlePromotionChoice,
  } = useChessGame();

  const gameStatusMessage = () => {
    if (gameState.isCheckmate) return `Checkmate! ${gameState.currentPlayer === 'white' ? 'Black' : 'White'} wins.`;
    if (gameState.isStalemate) return 'Stalemate! The game is a draw.';
    if (gameState.isCheck) return 'Check!';
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white font-sans p-4">
      <header className="text-center mb-4">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 flex items-center justify-center gap-3">
          <CrownIcon className="w-8 h-8 md:w-10 md:h-10 transform -rotate-12" />
          PARTH BOT
          <CrownIcon className="w-8 h-8 md:w-10 md:h-10 transform rotate-12" />
        </h1>
        <p className="text-stone-400">An AI opponent with a 1500 ELO target strength.</p>
      </header>

      <main className="flex flex-col lg:flex-row justify-center items-start gap-8">
        <div className="w-full max-w-lg xl:max-w-xl mx-auto">
          <ChessBoard
            board={gameState.board}
            onSquareClick={handleSquareClick}
            selectedSquare={selectedPiece}
            validMoves={validMoves}
            lastMove={gameState.moveHistory[gameState.moveHistory.length - 1]}
            promotionMove={promotionMove}
            onPromotionChoice={handlePromotionChoice}
          />
           <div className="mt-4 text-center text-yellow-400 font-bold text-2xl h-8">
            {gameStatusMessage()}
          </div>
        </div>
        <div className="w-full lg:w-96 bg-stone-800/50 rounded-lg p-4 shadow-2xl">
          <GameInfo
            gameState={gameState}
            onNewGame={newGame}
            onUndo={undoMove}
            aiIsThinking={aiIsThinking}
          />
        </div>
      </main>
    </div>
  );
};

export default App;