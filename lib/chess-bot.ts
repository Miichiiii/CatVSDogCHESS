import {
  type ChessPiece,
  type Position,
  PieceType,
  PieceColor,
} from "./chess-types";
import { isValidMove, makeMove, isCheckmate } from "./chess-rules";

// Piece values for evaluation
const PIECE_VALUES = {
  [PieceType.PAWN]: 100,
  [PieceType.KNIGHT]: 320,
  [PieceType.BISHOP]: 330,
  [PieceType.ROOK]: 500,
  [PieceType.QUEEN]: 900,
  [PieceType.KING]: 20000,
};

// Position bonus tables (encourage better piece placement)
const PAWN_POSITION_BONUS = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_POSITION_BONUS = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_POSITION_BONUS = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const KING_POSITION_BONUS = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

interface Move {
  from: Position;
  to: Position;
  score: number;
}

/**
 * Get position bonus for a piece based on its type and position
 */
function getPositionBonus(piece: ChessPiece, position: Position): number {
  const row =
    piece.color === PieceColor.WHITE ? position.row : 7 - position.row;

  switch (piece.type) {
    case PieceType.PAWN:
      return PAWN_POSITION_BONUS[row][position.col];
    case PieceType.KNIGHT:
      return KNIGHT_POSITION_BONUS[row][position.col];
    case PieceType.BISHOP:
      return BISHOP_POSITION_BONUS[row][position.col];
    case PieceType.KING:
      return KING_POSITION_BONUS[row][position.col];
    default:
      return 0;
  }
}

/**
 * Evaluate the board position from the bot's perspective
 */
function evaluateBoard(
  board: (ChessPiece | null)[][],
  botColor: PieceColor,
): number {
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const pieceValue = PIECE_VALUES[piece.type];
      const positionBonus = getPositionBonus(piece, { row, col });
      const pieceScore = pieceValue + positionBonus;

      if (piece.color === botColor) {
        score += pieceScore;
      } else {
        score -= pieceScore;
      }
    }
  }

  return score;
}

/**
 * Find all valid moves for the bot
 */
function getAllValidMoves(
  board: (ChessPiece | null)[][],
  color: PieceColor,
): Move[] {
  const moves: Move[] = [];

  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.color !== color) continue;

      const from = { row: fromRow, col: fromCol };

      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          const to = { row: toRow, col: toCol };

          if (isValidMove(board, from, to, color)) {
            moves.push({ from, to, score: 0 });
          }
        }
      }
    }
  }

  return moves;
}

/**
 * Evaluate a single move by simulating it and scoring the resulting position
 */
function evaluateMove(
  board: (ChessPiece | null)[][],
  move: Move,
  botColor: PieceColor,
): number {
  const result = makeMove(board, move.from, move.to);
  let score = evaluateBoard(result.newBoard, botColor);

  // Bonus for capturing pieces
  if (result.capturedPiece) {
    score += PIECE_VALUES[result.capturedPiece.type] / 2;
  }

  // Check if this move results in checkmate (highest priority)
  const opponentColor =
    botColor === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
  if (isCheckmate(result.newBoard, opponentColor)) {
    score += 100000;
  }

  return score;
}

/**
 * Calculate the best move for the bot using a simple evaluation
 */
export function calculateBotMove(
  board: (ChessPiece | null)[][],
  botColor: PieceColor,
  difficulty: "easy" | "medium" | "hard" = "medium",
  personality: "balanced" | "aggressive" | "defensive" = "balanced",
): { from: Position; to: Position } | null {
  const moves = getAllValidMoves(board, botColor);

  if (moves.length === 0) {
    return null;
  }

  // Evaluate all moves with personality influence
  for (const move of moves) {
    let baseScore = evaluateMove(board, move, botColor);

    // Apply personality modifiers
    if (personality === "aggressive") {
      // Boost attacking moves
      const targetPiece = board[move.to.row][move.to.col];
      if (targetPiece) {
        baseScore += 150; // Extra bonus for captures
      }
      // Penalize defensive moves slightly
      baseScore -= getDefensiveBonus(board, move) * 0.5;
    } else if (personality === "defensive") {
      // Boost defensive moves
      baseScore += getDefensiveBonus(board, move) * 1.5;
      // Penalize risky attacks
      const targetPiece = board[move.to.row][move.to.col];
      if (targetPiece) {
        baseScore -= 50; // Less aggressive on captures
      }
    }
    // balanced uses default scores

    move.score = baseScore;
  }

  // Sort moves by score (highest first)
  moves.sort((a, b) => b.score - a.score);

  // Add some randomness based on difficulty
  let selectedMove: Move;
  if (difficulty === "easy") {
    // Easy: 50% chance to pick a random move from top 5
    if (Math.random() < 0.5 && moves.length > 5) {
      const randomIndex = Math.floor(Math.random() * Math.min(5, moves.length));
      selectedMove = moves[randomIndex];
    } else {
      selectedMove = moves[0];
    }
  } else if (difficulty === "medium") {
    // Medium: 30% chance to pick a random move from top 3
    if (Math.random() < 0.3 && moves.length > 3) {
      const randomIndex = Math.floor(Math.random() * Math.min(3, moves.length));
      selectedMove = moves[randomIndex];
    } else {
      selectedMove = moves[0];
    }
  } else {
    // Hard: Always pick the best move
    selectedMove = moves[0];
  }

  return {
    from: selectedMove.from,
    to: selectedMove.to,
  };
}

// Helper function to calculate defensive bonus
function getDefensiveBonus(board: (ChessPiece | null)[][], move: Move): number {
  let bonus = 0;
  const piece = board[move.from.row][move.from.col];
  if (!piece) return 0;

  // Check if move protects important pieces
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const targetPiece = board[row][col];
      if (targetPiece && targetPiece.color === piece.color) {
        // Calculate Manhattan distance
        const dist = Math.abs(move.to.row - row) + Math.abs(move.to.col - col);
        if (dist <= 2) {
          // Bonus for staying close to own pieces
          bonus += PIECE_VALUES[targetPiece.type] / 20;
        }
      }
    }
  }

  return bonus;
}
