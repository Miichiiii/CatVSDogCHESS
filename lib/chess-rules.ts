import { type ChessPiece, PieceType, PieceColor, type Position, type MoveResult } from "./chess-types"
import { cloneBoard, findKingPosition } from "./chess-utils"

// Check if a move is valid for a specific piece
export function isValidMove(
  board: (ChessPiece | null)[][],
  from: Position,
  to: Position,
  currentPlayer: PieceColor,
): boolean {
  // Cannot move to the same position
  if (from.row === to.row && from.col === to.col) {
    return false
  }

  const piece = board[from.row][from.col]

  // No piece at the starting position or wrong player's piece
  if (!piece || piece.color !== currentPlayer) {
    return false
  }

  const targetPiece = board[to.row][to.col]

  // Cannot capture own piece
  if (targetPiece && targetPiece.color === piece.color) {
    return false
  }

  // Check piece-specific movement rules
  let validPieceMove = false

  switch (piece.type) {
    case PieceType.PAWN:
      validPieceMove = isValidPawnMove(board, from, to)
      break
    case PieceType.ROOK:
      validPieceMove = isValidRookMove(board, from, to)
      break
    case PieceType.KNIGHT:
      validPieceMove = isValidKnightMove(from, to)
      break
    case PieceType.BISHOP:
      validPieceMove = isValidBishopMove(board, from, to)
      break
    case PieceType.QUEEN:
      validPieceMove = isValidQueenMove(board, from, to)
      break
    case PieceType.KING:
      validPieceMove = isValidKingMove(board, from, to)
      break
  }

  if (!validPieceMove) {
    return false
  }

  // Check if the move would put or leave the king in check
  const newBoard = cloneBoard(board)
  newBoard[to.row][to.col] = newBoard[from.row][from.col]
  newBoard[from.row][from.col] = null

  return !isKingInCheck(newBoard, piece.color)
}

// Make a move and return the new board state
export function makeMove(board: (ChessPiece | null)[][], from: Position, to: Position): MoveResult {
  const newBoard = cloneBoard(board)
  const piece = newBoard[from.row][from.col]
  const capturedPiece = newBoard[to.row][to.col]

  if (!piece) {
    return { newBoard, capturedPiece: null }
  }

  // Update hasMoved property for pawns, kings, and rooks (for castling)
  if (piece.type === PieceType.PAWN || piece.type === PieceType.KING || piece.type === PieceType.ROOK) {
    piece.hasMoved = true
  }

  // Handle pawn promotion
  if (piece.type === PieceType.PAWN && (to.row === 0 || to.row === 7)) {
    piece.type = PieceType.QUEEN // Auto-promote to queen for simplicity
  }

  // Handle castling
  if (piece.type === PieceType.KING && Math.abs(from.col - to.col) === 2) {
    const isKingSide = to.col > from.col
    const rookCol = isKingSide ? 7 : 0
    const newRookCol = isKingSide ? from.col + 1 : from.col - 1

    // Move the rook
    const rook = newBoard[from.row][rookCol]
    newBoard[from.row][newRookCol] = rook
    newBoard[from.row][rookCol] = null

    if (rook) {
      rook.hasMoved = true
    }
  }

  // Make the move
  newBoard[to.row][to.col] = piece
  newBoard[from.row][from.col] = null

  return { newBoard, capturedPiece }
}

// Check if the king of the given color is in check
export function isCheck(board: (ChessPiece | null)[][], color: PieceColor): boolean {
  return isKingInCheck(board, color)
}

// Check if the king of the given color is in checkmate
export function isCheckmate(board: (ChessPiece | null)[][], color: PieceColor): boolean {
  // If the king is not in check, it's not checkmate
  if (!isKingInCheck(board, color)) {
    return false
  }

  // Check if any move can get the king out of check
  return !hasLegalMoves(board, color)
}

// Check if the position is a stalemate
export function isStalemate(board: (ChessPiece | null)[][], color: PieceColor): boolean {
  // If the king is in check, it's not stalemate
  if (isKingInCheck(board, color)) {
    return false
  }

  // If the player has no legal moves, it's stalemate
  return !hasLegalMoves(board, color)
}

// Helper function to check if a player has any legal moves
function hasLegalMoves(board: (ChessPiece | null)[][], color: PieceColor): boolean {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol]
      if (piece && piece.color === color) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(board, { row: fromRow, col: fromCol }, { row: toRow, col: toCol }, color)) {
              return true
            }
          }
        }
      }
    }
  }
  return false
}

// Helper function to check if the king is in check
function isKingInCheck(board: (ChessPiece | null)[][], kingColor: PieceColor): boolean {
  const kingPosition = findKingPosition(board, kingColor)
  if (!kingPosition) return false

  const opponentColor = kingColor === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE

  // Check if any opponent piece can capture the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === opponentColor) {
        // Use a simplified version of isValidMove that doesn't check for check
        // to avoid infinite recursion
        if (canPieceMove(board, { row, col }, kingPosition)) {
          return true
        }
      }
    }
  }

  return false
}

// Simplified version of isValidMove that doesn't check for check
function canPieceMove(board: (ChessPiece | null)[][], from: Position, to: Position): boolean {
  const piece = board[from.row][from.col]
  if (!piece) return false

  const targetPiece = board[to.row][to.col]
  if (targetPiece && targetPiece.color === piece.color) return false

  switch (piece.type) {
    case PieceType.PAWN:
      return isValidPawnMove(board, from, to)
    case PieceType.ROOK:
      return isValidRookMove(board, from, to)
    case PieceType.KNIGHT:
      return isValidKnightMove(from, to)
    case PieceType.BISHOP:
      return isValidBishopMove(board, from, to)
    case PieceType.QUEEN:
      return isValidQueenMove(board, from, to)
    case PieceType.KING:
      return isValidKingMove(board, from, to)
    default:
      return false
  }
}

// Check if a pawn move is valid
function isValidPawnMove(board: (ChessPiece | null)[][], from: Position, to: Position): boolean {
  const piece = board[from.row][from.col]
  if (!piece || piece.type !== PieceType.PAWN) return false

  const direction = piece.color === PieceColor.WHITE ? -1 : 1
  const startRow = piece.color === PieceColor.WHITE ? 6 : 1

  // Moving forward one square
  if (from.col === to.col && from.row + direction === to.row && !board[to.row][to.col]) {
    return true
  }

  // Moving forward two squares from starting position
  if (
    from.col === to.col &&
    from.row === startRow &&
    from.row + 2 * direction === to.row &&
    !board[from.row + direction][from.col] &&
    !board[to.row][to.col]
  ) {
    return true
  }

  // Capturing diagonally
  if ((from.col + 1 === to.col || from.col - 1 === to.col) && from.row + direction === to.row) {
    return board[to.row][to.col] !== null
  }

  return false
}

// Check if a rook move is valid
function isValidRookMove(board: (ChessPiece | null)[][], from: Position, to: Position): boolean {
  // Rooks move horizontally or vertically
  if (from.row !== to.row && from.col !== to.col) {
    return false
  }

  // Check if the path is clear
  if (from.row === to.row) {
    // Horizontal movement
    const start = Math.min(from.col, to.col)
    const end = Math.max(from.col, to.col)

    for (let col = start + 1; col < end; col++) {
      if (board[from.row][col] !== null) {
        return false
      }
    }
  } else {
    // Vertical movement
    const start = Math.min(from.row, to.row)
    const end = Math.max(from.row, to.row)

    for (let row = start + 1; row < end; row++) {
      if (board[row][from.col] !== null) {
        return false
      }
    }
  }

  return true
}

// Check if a knight move is valid
function isValidKnightMove(from: Position, to: Position): boolean {
  const rowDiff = Math.abs(from.row - to.row)
  const colDiff = Math.abs(from.col - to.col)

  // Knights move in an L-shape: 2 squares in one direction and 1 square perpendicular
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
}

// Check if a bishop move is valid
function isValidBishopMove(board: (ChessPiece | null)[][], from: Position, to: Position): boolean {
  const rowDiff = Math.abs(from.row - to.row)
  const colDiff = Math.abs(from.col - to.col)

  // Bishops move diagonally
  if (rowDiff !== colDiff) {
    return false
  }

  // Check if the path is clear
  const rowDirection = from.row < to.row ? 1 : -1
  const colDirection = from.col < to.col ? 1 : -1

  for (let i = 1; i < rowDiff; i++) {
    if (board[from.row + i * rowDirection][from.col + i * colDirection] !== null) {
      return false
    }
  }

  return true
}

// Check if a queen move is valid
function isValidQueenMove(board: (ChessPiece | null)[][], from: Position, to: Position): boolean {
  // Queens can move like rooks or bishops
  return isValidRookMove(board, from, to) || isValidBishopMove(board, from, to)
}

// Check if a king move is valid
function isValidKingMove(board: (ChessPiece | null)[][], from: Position, to: Position): boolean {
  const rowDiff = Math.abs(from.row - to.row)
  const colDiff = Math.abs(from.col - to.col)

  // Kings move one square in any direction
  if (rowDiff <= 1 && colDiff <= 1) {
    return true
  }

  // Check for castling
  const piece = board[from.row][from.col]
  if (piece && piece.type === PieceType.KING && !piece.hasMoved && rowDiff === 0 && colDiff === 2) {
    // Determine if it's kingside or queenside castling
    const isKingSide = to.col > from.col
    const rookCol = isKingSide ? 7 : 0

    // Check if the rook is in place and hasn't moved
    const rook = board[from.row][rookCol]
    if (!rook || rook.type !== PieceType.ROOK || rook.color !== piece.color || rook.hasMoved) {
      return false
    }

    // Check if the path is clear
    const start = isKingSide ? from.col + 1 : rookCol + 1
    const end = isKingSide ? rookCol : from.col

    for (let col = start; col < end; col++) {
      if (board[from.row][col] !== null) {
        return false
      }
    }

    // Check if the king is in check or would pass through check
    const tempBoard = cloneBoard(board)
    tempBoard[from.row][from.col] = null

    // Check if the king is in check
    if (isKingInCheck(tempBoard, piece.color)) {
      return false
    }

    // Check if the king would pass through check
    tempBoard[from.row][isKingSide ? from.col + 1 : from.col - 1] = piece
    if (isKingInCheck(tempBoard, piece.color)) {
      return false
    }

    return true
  }

  return false
}
