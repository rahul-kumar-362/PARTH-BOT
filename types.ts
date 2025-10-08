
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';
export type Square = string; // e.g., 'e4', 'a1'

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export interface Move {
  from: Square;
  to: Square;
  piece: ChessPiece;
  captured?: ChessPiece | null;
  promotion?: PieceType;
  castling?: 'kingside' | 'queenside';
  enPassant?: boolean;
}

export interface GameState {
  board: (ChessPiece | null)[][];
  currentPlayer: PieceColor;
  moveHistory: Move[];
  castlingRights: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
  enPassantTarget: Square | null;
  halfMoveClock: number;
  fullMoveNumber: number;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isGameOver: boolean;
}

export interface Position {
  row: number;
  col: number;
}
