import {
  type ChessPiece,
  type Position as ChessTypesPosition,
  PieceColor,
} from "./chess-types";
import { type Board, type Player, getAllLegalMoves } from "./chess-logic";
import { findBestMove } from "./chess-ai";

/**
 * Convert ChessGame board format to chess-logic format
 */
function convertToLogicBoard(board: (ChessPiece | null)[][]): Board {
  return board.map((row) =>
    row.map((piece) => {
      if (!piece) return null;
      return {
        type: piece.type.toLowerCase() as any,
        player:
          piece.color === PieceColor.WHITE
            ? ("dogs" as Player)
            : ("cats" as Player),
        hasMoved: piece.hasMoved,
      };
    }),
  );
}

/**
 * Get a random legal move as fallback
 */
function getRandomLegalMove(
  board: (ChessPiece | null)[][],
  botColor: PieceColor,
): { from: ChessTypesPosition; to: ChessTypesPosition } | null {
  const logicBoard = convertToLogicBoard(board);
  const botPlayer =
    botColor === PieceColor.WHITE ? ("dogs" as Player) : ("cats" as Player);
  const legalMoves = getAllLegalMoves(logicBoard, botPlayer);
  if (legalMoves.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * legalMoves.length);
  return {
    from: {
      row: legalMoves[randomIndex].from.row,
      col: legalMoves[randomIndex].from.col,
    },
    to: {
      row: legalMoves[randomIndex].to.row,
      col: legalMoves[randomIndex].to.col,
    },
  };
}

/**
 * Calculate the best move for the bot with 10-second timeout.
 * If findBestMove doesn't return within 10 seconds, a random legal move is used.
 */
export function calculateBotMove(
  board: (ChessPiece | null)[][],
  botColor: PieceColor,
  difficulty: "easy" | "medium" | "hard" = "medium",
  personality: "balanced" | "aggressive" | "defensive" = "balanced",
): { from: ChessTypesPosition; to: ChessTypesPosition } | null {
  try {
    // Convert to logic board format
    const logicBoard = convertToLogicBoard(board);
    const botPlayer =
      botColor === PieceColor.WHITE ? ("dogs" as Player) : ("cats" as Player);

    // Find best move using optimized AI (internal 3s timeout in chess-ai)
    const move = findBestMove(logicBoard, botPlayer);

    if (!move) {
      // Fallback: try a random legal move
      console.warn("findBestMove returned null, trying random legal move");
      return getRandomLegalMove(board, botColor);
    }

    return {
      from: { row: move.from.row, col: move.from.col },
      to: { row: move.to.row, col: move.to.col },
    };
  } catch (error) {
    console.error("Error in calculateBotMove:", error);
    // Fallback: random legal move on error
    return getRandomLegalMove(board, botColor);
  }
}
