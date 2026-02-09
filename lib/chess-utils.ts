import { type ChessPiece, PieceType } from "./chess-types";

export function getPieceSymbol(piece: ChessPiece): string {
  const symbols = {
    [PieceType.PAWN]: { white: "♙", black: "♟" },
    [PieceType.ROOK]: { white: "♖", black: "♜" },
    [PieceType.KNIGHT]: { white: "♘", black: "♞" },
    [PieceType.BISHOP]: { white: "♗", black: "♝" },
    [PieceType.QUEEN]: { white: "♕", black: "♛" },
    [PieceType.KING]: { white: "♔", black: "♚" },
  };

  return symbols[piece.type][piece.color];
}

export function getPieceOverlaySymbol(piece: ChessPiece): string {
  const symbols = {
    [PieceType.KING]: "♔",
    [PieceType.QUEEN]: "♕",
    [PieceType.ROOK]: "♖",
    [PieceType.BISHOP]: "♗",
    [PieceType.KNIGHT]: "♘",
    [PieceType.PAWN]: "♙",
  };
  return symbols[piece.type];
}

export function getPieceImagePath(piece: ChessPiece): string {
  return `/pieces/${piece.color} ${piece.type}.png`;
}

export function cloneBoard(
  board: (ChessPiece | null)[][],
): (ChessPiece | null)[][] {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

export function findKingPosition(
  board: (ChessPiece | null)[][],
  color: string,
): { row: number; col: number } | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PieceType.KING && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}
