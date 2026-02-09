import { type ChessPiece, type Position, PieceColor } from "./chess-types";

/**
 * Berechnet die Manhattan-Distanz zwischen zwei Positionen
 */
function getManhattanDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

/**
 * Findet die nächstgelegene Figur einer bestimmten Farbe zu einer Zielposition
 */
export function findClosestPiece(
  board: (ChessPiece | null)[][],
  targetPosition: Position,
  color: PieceColor,
): Position | null {
  let closestPosition: Position | null = null;
  let minDistance = Infinity;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const distance = getManhattanDistance({ row, col }, targetPosition);
        if (distance < minDistance) {
          minDistance = distance;
          closestPosition = { row, col };
        }
      }
    }
  }

  return closestPosition;
}

/**
 * Überprüft ob ein Feld leer ist
 */
export function isEmptySquare(
  board: (ChessPiece | null)[][],
  position: Position,
): boolean {
  return board[position.row][position.col] === null;
}

/**
 * Überprüft ob eine Position innerhalb des Schachbretts liegt
 */
export function isValidPosition(position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row < 8 &&
    position.col >= 0 &&
    position.col < 8
  );
}
