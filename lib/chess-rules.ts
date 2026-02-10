import {
  type ChessPiece,
  PieceType,
  PieceColor,
  type Position,
  type MoveResult,
  type EnPassantTarget,
} from "./chess-types";
import { cloneBoard, findKingPosition } from "./chess-utils";

// ==================== EN PASSANT STATE ====================

let enPassantTarget: EnPassantTarget | null = null;

export function getEnPassantTarget(): EnPassantTarget | null {
  return enPassantTarget;
}

export function setEnPassantTarget(target: EnPassantTarget | null): void {
  enPassantTarget = target;
}

export function clearEnPassantTarget(): void {
  enPassantTarget = null;
}

// ==================== MOVE VALIDATION ====================

// Check if a move is valid for a specific piece
export function isValidMove(
  board: (ChessPiece | null)[][],
  from: Position,
  to: Position,
  currentPlayer: PieceColor,
): boolean {
  // Cannot move to the same position
  if (from.row === to.row && from.col === to.col) {
    return false;
  }

  const piece = board[from.row][from.col];

  // No piece at the starting position or wrong player's piece
  if (!piece || piece.color !== currentPlayer) {
    return false;
  }

  const targetPiece = board[to.row][to.col];

  // Cannot capture own piece (EXCEPT: castling where king clicks on own rook)
  if (targetPiece && targetPiece.color === piece.color) {
    // Allow king to click on own rook for castling
    if (piece.type === PieceType.KING && targetPiece.type === PieceType.ROOK) {
      return canCastle(board, from, to);
    }
    return false;
  }

  // Check piece-specific movement rules
  let validPieceMove = false;

  switch (piece.type) {
    case PieceType.PAWN:
      validPieceMove = isValidPawnMove(board, from, to);
      break;
    case PieceType.ROOK:
      validPieceMove = isValidRookMove(board, from, to);
      break;
    case PieceType.KNIGHT:
      validPieceMove = isValidKnightMove(from, to);
      break;
    case PieceType.BISHOP:
      validPieceMove = isValidBishopMove(board, from, to);
      break;
    case PieceType.QUEEN:
      validPieceMove = isValidQueenMove(board, from, to);
      break;
    case PieceType.KING:
      validPieceMove = isValidKingMove(board, from, to);
      break;
  }

  if (!validPieceMove) {
    return false;
  }

  // Check if the move would put or leave the king in check
  const newBoard = cloneBoard(board);

  // Handle en passant capture for check test
  if (
    piece.type === PieceType.PAWN &&
    enPassantTarget &&
    to.row === enPassantTarget.capturePosition.row &&
    to.col === enPassantTarget.capturePosition.col
  ) {
    newBoard[enPassantTarget.position.row][enPassantTarget.position.col] = null;
  }

  newBoard[to.row][to.col] = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = null;

  return !isKingInCheck(newBoard, piece.color);
}

// ==================== MAKE MOVE ====================

// Make a move and return the new board state
export function makeMove(
  board: (ChessPiece | null)[][],
  from: Position,
  to: Position,
): MoveResult {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from.row][from.col];
  let capturedPiece = newBoard[to.row][to.col];
  let isCastling = false;
  let isEnPassant = false;
  let isPromotion = false;
  let promotionPosition: Position | undefined;

  if (!piece) {
    return { newBoard, capturedPiece: null };
  }

  // Handle castling: King clicks on own Rook
  if (
    piece.type === PieceType.KING &&
    capturedPiece &&
    capturedPiece.type === PieceType.ROOK &&
    capturedPiece.color === piece.color
  ) {
    isCastling = true;
    const isKingSide = to.col > from.col;

    // Place king and rook in correct positions
    const newKingCol = isKingSide ? 6 : 2;
    const newRookCol = isKingSide ? 5 : 3;

    // Clear old positions
    newBoard[from.row][from.col] = null;
    newBoard[to.row][to.col] = null;

    // Place pieces
    newBoard[from.row][newKingCol] = { ...piece, hasMoved: true };
    newBoard[from.row][newRookCol] = {
      type: PieceType.ROOK,
      color: piece.color,
      hasMoved: true,
    };

    clearEnPassantTarget();
    return { newBoard, capturedPiece: null, isCastling };
  }

  // Handle en passant capture
  if (
    piece.type === PieceType.PAWN &&
    enPassantTarget &&
    to.row === enPassantTarget.capturePosition.row &&
    to.col === enPassantTarget.capturePosition.col
  ) {
    isEnPassant = true;
    capturedPiece =
      newBoard[enPassantTarget.position.row][enPassantTarget.position.col];
    newBoard[enPassantTarget.position.row][enPassantTarget.position.col] = null;
  }

  // Track en passant: if pawn moves 2 squares, set en passant target
  if (piece.type === PieceType.PAWN && Math.abs(from.row - to.row) === 2) {
    const captureRow = (from.row + to.row) / 2;
    setEnPassantTarget({
      position: { row: to.row, col: to.col },
      capturePosition: { row: captureRow, col: to.col },
    });
  } else {
    clearEnPassantTarget();
  }

  // Update hasMoved property
  if (
    piece.type === PieceType.PAWN ||
    piece.type === PieceType.KING ||
    piece.type === PieceType.ROOK
  ) {
    piece.hasMoved = true;
  }

  // Handle pawn promotion detection (don't auto-promote - let the UI handle it)
  if (piece.type === PieceType.PAWN && (to.row === 0 || to.row === 7)) {
    isPromotion = true;
    promotionPosition = { row: to.row, col: to.col };
  }

  // Make the move
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  return {
    newBoard,
    capturedPiece,
    isCastling,
    isEnPassant,
    isPromotion,
    promotionPosition,
  };
}

// Promote a pawn to the selected piece type
export function promotePawn(
  board: (ChessPiece | null)[][],
  position: Position,
  promotionType: PieceType,
): (ChessPiece | null)[][] {
  const newBoard = cloneBoard(board);
  const piece = newBoard[position.row][position.col];
  if (piece) {
    newBoard[position.row][position.col] = {
      type: promotionType,
      color: piece.color,
      hasMoved: true,
    };
  }
  return newBoard;
}

// ==================== CHECK / CHECKMATE / STALEMATE ====================

// Check if the king of the given color is in check
export function isCheck(
  board: (ChessPiece | null)[][],
  color: PieceColor,
): boolean {
  return isKingInCheck(board, color);
}

// Check if the king of the given color is in checkmate
export function isCheckmate(
  board: (ChessPiece | null)[][],
  color: PieceColor,
): boolean {
  if (!isKingInCheck(board, color)) {
    return false;
  }
  return !hasLegalMoves(board, color);
}

// Check if the position is a stalemate
export function isStalemate(
  board: (ChessPiece | null)[][],
  color: PieceColor,
): boolean {
  if (isKingInCheck(board, color)) {
    return false;
  }
  return !hasLegalMoves(board, color);
}

// ==================== INSUFFICIENT MATERIAL ====================

export function hasInsufficientMaterial(
  board: (ChessPiece | null)[][],
): boolean {
  const whitePieces: ChessPiece[] = [];
  const blackPieces: ChessPiece[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        if (piece.color === PieceColor.WHITE) whitePieces.push(piece);
        else blackPieces.push(piece);
      }
    }
  }

  // King vs King
  if (whitePieces.length === 1 && blackPieces.length === 1) return true;

  // King + Bishop vs King or King + Knight vs King
  if (whitePieces.length === 1 && blackPieces.length === 2) {
    const nonKing = blackPieces.find((p) => p.type !== PieceType.KING);
    if (
      nonKing &&
      (nonKing.type === PieceType.BISHOP || nonKing.type === PieceType.KNIGHT)
    )
      return true;
  }
  if (blackPieces.length === 1 && whitePieces.length === 2) {
    const nonKing = whitePieces.find((p) => p.type !== PieceType.KING);
    if (
      nonKing &&
      (nonKing.type === PieceType.BISHOP || nonKing.type === PieceType.KNIGHT)
    )
      return true;
  }

  // King + Bishop vs King + Bishop (same color bishops)
  if (whitePieces.length === 2 && blackPieces.length === 2) {
    const whiteBishop = whitePieces.find((p) => p.type === PieceType.BISHOP);
    const blackBishop = blackPieces.find((p) => p.type === PieceType.BISHOP);
    if (whiteBishop && blackBishop) {
      // Find bishop positions to check square colors
      let whiteBishopPos: Position | null = null;
      let blackBishopPos: Position | null = null;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const p = board[row][col];
          if (p && p.type === PieceType.BISHOP) {
            if (p.color === PieceColor.WHITE) whiteBishopPos = { row, col };
            else blackBishopPos = { row, col };
          }
        }
      }
      if (whiteBishopPos && blackBishopPos) {
        const whiteSquareColor = (whiteBishopPos.row + whiteBishopPos.col) % 2;
        const blackSquareColor = (blackBishopPos.row + blackBishopPos.col) % 2;
        if (whiteSquareColor === blackSquareColor) return true;
      }
    }
  }

  return false;
}

// ==================== HELPER FUNCTIONS ====================

// Helper function to check if a player has any legal moves
function hasLegalMoves(
  board: (ChessPiece | null)[][],
  color: PieceColor,
): boolean {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.color === color) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (
              isValidMove(
                board,
                { row: fromRow, col: fromCol },
                { row: toRow, col: toCol },
                color,
              )
            ) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

// Helper function to check if the king is in check
function isKingInCheck(
  board: (ChessPiece | null)[][],
  kingColor: PieceColor,
): boolean {
  const kingPosition = findKingPosition(board, kingColor);
  if (!kingPosition) return false;

  const opponentColor =
    kingColor === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === opponentColor) {
        if (canPieceAttack(board, { row, col }, kingPosition)) {
          return true;
        }
      }
    }
  }

  return false;
}

// Simplified movement check (no check-for-check, avoids infinite recursion)
function canPieceAttack(
  board: (ChessPiece | null)[][],
  from: Position,
  to: Position,
): boolean {
  const piece = board[from.row][from.col];
  if (!piece) return false;

  const targetPiece = board[to.row][to.col];
  if (targetPiece && targetPiece.color === piece.color) return false;

  switch (piece.type) {
    case PieceType.PAWN:
      return canPawnAttack(piece, from, to);
    case PieceType.ROOK:
      return isValidRookMove(board, from, to);
    case PieceType.KNIGHT:
      return isValidKnightMove(from, to);
    case PieceType.BISHOP:
      return isValidBishopMove(board, from, to);
    case PieceType.QUEEN:
      return isValidQueenMove(board, from, to);
    case PieceType.KING:
      return (
        Math.abs(from.row - to.row) <= 1 && Math.abs(from.col - to.col) <= 1
      );
    default:
      return false;
  }
}

// Check pawn attack squares only (diagonal captures)
function canPawnAttack(
  piece: ChessPiece,
  from: Position,
  to: Position,
): boolean {
  const direction = piece.color === PieceColor.WHITE ? -1 : 1;
  return (
    (from.col + 1 === to.col || from.col - 1 === to.col) &&
    from.row + direction === to.row
  );
}

// ==================== PIECE MOVEMENT RULES ====================

// Check if a pawn move is valid
function isValidPawnMove(
  board: (ChessPiece | null)[][],
  from: Position,
  to: Position,
): boolean {
  const piece = board[from.row][from.col];
  if (!piece || piece.type !== PieceType.PAWN) return false;

  const direction = piece.color === PieceColor.WHITE ? -1 : 1;
  const startRow = piece.color === PieceColor.WHITE ? 6 : 1;

  // Moving forward one square
  if (
    from.col === to.col &&
    from.row + direction === to.row &&
    !board[to.row][to.col]
  ) {
    return true;
  }

  // Moving forward two squares from starting position
  if (
    from.col === to.col &&
    from.row === startRow &&
    from.row + 2 * direction === to.row &&
    !board[from.row + direction][from.col] &&
    !board[to.row][to.col]
  ) {
    return true;
  }

  // Capturing diagonally
  if (
    (from.col + 1 === to.col || from.col - 1 === to.col) &&
    from.row + direction === to.row
  ) {
    // Normal capture
    if (board[to.row][to.col] !== null) return true;

    // En passant capture
    if (
      enPassantTarget &&
      to.row === enPassantTarget.capturePosition.row &&
      to.col === enPassantTarget.capturePosition.col
    ) {
      return true;
    }
  }

  return false;
}

// Check if a rook move is valid
function isValidRookMove(
  board: (ChessPiece | null)[][],
  from: Position,
  to: Position,
): boolean {
  if (from.row !== to.row && from.col !== to.col) {
    return false;
  }

  if (from.row === to.row) {
    const start = Math.min(from.col, to.col);
    const end = Math.max(from.col, to.col);
    for (let col = start + 1; col < end; col++) {
      if (board[from.row][col] !== null) return false;
    }
  } else {
    const start = Math.min(from.row, to.row);
    const end = Math.max(from.row, to.row);
    for (let row = start + 1; row < end; row++) {
      if (board[row][from.col] !== null) return false;
    }
  }

  return true;
}

// Check if a knight move is valid
function isValidKnightMove(from: Position, to: Position): boolean {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

// Check if a bishop move is valid
function isValidBishopMove(
  board: (ChessPiece | null)[][],
  from: Position,
  to: Position,
): boolean {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);

  if (rowDiff !== colDiff) return false;

  const rowDirection = from.row < to.row ? 1 : -1;
  const colDirection = from.col < to.col ? 1 : -1;

  for (let i = 1; i < rowDiff; i++) {
    if (
      board[from.row + i * rowDirection][from.col + i * colDirection] !== null
    )
      return false;
  }

  return true;
}

// Check if a queen move is valid
function isValidQueenMove(
  board: (ChessPiece | null)[][],
  from: Position,
  to: Position,
): boolean {
  return isValidRookMove(board, from, to) || isValidBishopMove(board, from, to);
}

// Check if a king move is valid (normal 1-square moves only)
function isValidKingMove(
  board: (ChessPiece | null)[][],
  from: Position,
  to: Position,
): boolean {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  return rowDiff <= 1 && colDiff <= 1;
}

// ==================== CASTLING ====================

// Check if castling is possible (King clicks on own Rook)
function canCastle(
  board: (ChessPiece | null)[][],
  kingPos: Position,
  rookPos: Position,
): boolean {
  const king = board[kingPos.row][kingPos.col];
  const rook = board[rookPos.row][rookPos.col];

  if (!king || !rook) return false;
  if (king.type !== PieceType.KING || rook.type !== PieceType.ROOK)
    return false;
  if (king.color !== rook.color) return false;
  if (king.hasMoved || rook.hasMoved) return false;
  if (kingPos.row !== rookPos.row) return false;

  const isKingSide = rookPos.col > kingPos.col;

  // Check if the path between king and rook is clear
  const start = Math.min(kingPos.col, rookPos.col) + 1;
  const end = Math.max(kingPos.col, rookPos.col);
  for (let col = start; col < end; col++) {
    if (board[kingPos.row][col] !== null) return false;
  }

  // Check if king is currently in check
  if (isKingInCheck(board, king.color)) return false;

  // Check if king passes through check
  const direction = isKingSide ? 1 : -1;
  for (let step = 1; step <= 2; step++) {
    const testCol = kingPos.col + step * direction;
    const testBoard = cloneBoard(board);
    testBoard[kingPos.row][kingPos.col] = null;
    testBoard[kingPos.row][testCol] = king;
    if (isKingInCheck(testBoard, king.color)) return false;
  }

  return true;
}

// ==================== BOARD TO STRING (for threefold repetition) ====================

export function boardToString(board: (ChessPiece | null)[][]): string {
  return board
    .map((row) =>
      row
        .map((piece) => {
          if (!piece) return ".";
          const colorChar = piece.color === PieceColor.WHITE ? "W" : "B";
          const typeChar = piece.type.charAt(0).toUpperCase();
          return colorChar + typeChar;
        })
        .join(""),
    )
    .join("/");
}

export function checkThreefoldRepetition(positionHistory: string[]): boolean {
  if (positionHistory.length < 5) return false;
  const lastPosition = positionHistory[positionHistory.length - 1];
  let count = 0;
  for (const pos of positionHistory) {
    if (pos === lastPosition) count++;
    if (count >= 3) return true;
  }
  return false;
}
