import {
  type ChessPiece,
  type Position as ChessTypesPosition,
  PieceColor,
} from "./chess-types";
import { type Board, type Player } from "./chess-logic";
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
 * Calculate the best move for the bot with 3-second timeout
 * Uses optimized minimax with alpha-beta pruning and move ordering
 */
export function calculateBotMove(
  board: (ChessPiece | null)[][],
  botColor: PieceColor,
  difficulty: "easy" | "medium" | "hard" = "medium",
  personality: "balanced" | "aggressive" | "defensive" = "balanced",
): { from: ChessTypesPosition; to: ChessTypesPosition } | null {
  // Convert to logic board format
  const logicBoard = convertToLogicBoard(board);
  const botPlayer =
    botColor === PieceColor.WHITE ? ("dogs" as Player) : ("cats" as Player);

  // Find best move using optimized AI (max 3 seconds)
  const move = findBestMove(logicBoard, botPlayer);

  if (!move) {
    return null;
  }

  return {
    from: { row: move.from.row, col: move.from.col },
    to: { row: move.to.row, col: move.to.col },
  };
}
