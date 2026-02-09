export enum PieceType {
  PAWN = "pawn",
  ROOK = "rook",
  KNIGHT = "knight",
  BISHOP = "bishop",
  QUEEN = "queen",
  KING = "king",
}

export enum PieceColor {
  WHITE = "white",
  BLACK = "black",
}

export interface ChessPiece {
  type: PieceType
  color: PieceColor
  hasMoved?: boolean
}

export interface Position {
  row: number
  col: number
}

export interface MoveResult {
  newBoard: (ChessPiece | null)[][]
  capturedPiece: ChessPiece | null
}

export function initialBoardState(): (ChessPiece | null)[][] {
  const board: (ChessPiece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))

  // Set up pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: PieceType.PAWN, color: PieceColor.BLACK, hasMoved: false }
    board[6][col] = { type: PieceType.PAWN, color: PieceColor.WHITE, hasMoved: false }
  }

  // Set up rooks
  board[0][0] = { type: PieceType.ROOK, color: PieceColor.BLACK, hasMoved: false }
  board[0][7] = { type: PieceType.ROOK, color: PieceColor.BLACK, hasMoved: false }
  board[7][0] = { type: PieceType.ROOK, color: PieceColor.WHITE, hasMoved: false }
  board[7][7] = { type: PieceType.ROOK, color: PieceColor.WHITE, hasMoved: false }

  // Set up knights
  board[0][1] = { type: PieceType.KNIGHT, color: PieceColor.BLACK }
  board[0][6] = { type: PieceType.KNIGHT, color: PieceColor.BLACK }
  board[7][1] = { type: PieceType.KNIGHT, color: PieceColor.WHITE }
  board[7][6] = { type: PieceType.KNIGHT, color: PieceColor.WHITE }

  // Set up bishops
  board[0][2] = { type: PieceType.BISHOP, color: PieceColor.BLACK }
  board[0][5] = { type: PieceType.BISHOP, color: PieceColor.BLACK }
  board[7][2] = { type: PieceType.BISHOP, color: PieceColor.WHITE }
  board[7][5] = { type: PieceType.BISHOP, color: PieceColor.WHITE }

  // Set up queens
  board[0][3] = { type: PieceType.QUEEN, color: PieceColor.BLACK }
  board[7][3] = { type: PieceType.QUEEN, color: PieceColor.WHITE }

  // Set up kings
  board[0][4] = { type: PieceType.KING, color: PieceColor.BLACK, hasMoved: false }
  board[7][4] = { type: PieceType.KING, color: PieceColor.WHITE, hasMoved: false }

  return board
}
