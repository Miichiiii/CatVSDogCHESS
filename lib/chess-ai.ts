import {
  type Board,
  type Position,
  type Player,
  getValidMoves,
  makeMove,
  isCheckmate,
} from "./chess-logic";

// ==================== EVALUATION ====================

const PIECE_VALUES: Record<string, number> = {
  pawn: 100,
  rook: 500,
  knight: 320,
  bishop: 330,
  queen: 900,
  king: 20000,
};

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

function evaluateBoard(board: Board, aiPlayer: Player): number {
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const pieceValue = PIECE_VALUES[piece.type] || 0;
      let positionBonus = 0;

      if (piece.type === "pawn") {
        const adjustedRow = piece.player === "dogs" ? row : 7 - row;
        positionBonus = PAWN_POSITION_BONUS[adjustedRow]?.[col] || 0;
      }

      const totalValue = pieceValue + positionBonus;

      if (piece.player === aiPlayer) {
        score += totalValue;
      } else {
        score -= totalValue;
      }
    }
  }

  return score;
}

// ==================== TIMEOUT MANAGEMENT ====================

let timeoutStart = 0;
let isTimeExpired = false;
const MAX_TIME_MS = 3000; // 3 Sekunden Timeout

let nodesEvaluated = 0;

function resetTimeout(): void {
  isTimeExpired = false;
  timeoutStart = Date.now();
  nodesEvaluated = 0;
}

function checkTimeout(): boolean {
  if (isTimeExpired) return true;
  const elapsed = Date.now() - timeoutStart;
  if (elapsed > MAX_TIME_MS) {
    isTimeExpired = true;
    console.log(`⏰ Timeout erreicht nach ${elapsed}ms`);
    return true;
  }
  return false;
}

// ==================== SCHNELLE MOVE GENERATION ====================

/**
 * Hole NUR gültige Züge ohne Check-Validierung (schneller!)
 */
function getQuickMoves(
  board: Board,
  player: Player,
): Array<{ from: Position; to: Position }> {
  const moves: Array<{ from: Position; to: Position }> = [];

  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.player === player) {
        const from = { row: fromRow, col: fromCol };
        const validMoves = getValidMoves(board, from);

        for (const to of validMoves) {
          moves.push({ from, to });
        }
      }
    }
  }

  return moves;
}

// ==================== MINIMAX WITH ALPHA-BETA PRUNING ====================

/**
 * SCHNELLER Minimax - mit aggressivem Timeout
 */
function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  aiPlayer: Player,
): number {
  nodesEvaluated++;

  // Aggressiver Timeout-Check alle 20 Nodes
  if (nodesEvaluated % 20 === 0 && checkTimeout()) {
    return evaluateBoard(board, aiPlayer);
  }

  // Basis-Fall
  if (depth === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  const opponent: Player = aiPlayer === "cats" ? "dogs" : "cats";
  const currentPlayer = isMaximizing ? aiPlayer : opponent;

  // Schnelle Move-Generation ohne vollständige Check-Validierung
  const moves = getQuickMoves(board, currentPlayer);

  if (moves.length === 0) {
    // Keine Züge - wahrscheinlich Checkmate oder Stalemate
    if (isCheckmate(board, currentPlayer)) {
      return isMaximizing ? -50000 + depth : 50000 - depth;
    }
    return 0;
  }

  // Limitiere Moves für bessere Performance
  const limitedMoves = moves.slice(0, Math.min(moves.length, 20));

  if (isMaximizing) {
    let maxEval = -Infinity;

    for (const move of limitedMoves) {
      if (checkTimeout()) break;

      const newBoard = makeMove(board, move.from, move.to);
      const evaluation = minimax(
        newBoard,
        depth - 1,
        false,
        alpha,
        beta,
        aiPlayer,
      );

      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);

      if (beta <= alpha) {
        break; // Beta-Cutoff
      }
    }

    return maxEval;
  } else {
    let minEval = Infinity;

    for (const move of limitedMoves) {
      if (checkTimeout()) break;

      const newBoard = makeMove(board, move.from, move.to);
      const evaluation = minimax(
        newBoard,
        depth - 1,
        true,
        alpha,
        beta,
        aiPlayer,
      );

      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);

      if (beta <= alpha) {
        break; // Alpha-Cutoff
      }
    }

    return minEval;
  }
}

// ==================== BEST MOVE FINDER ====================

/**
 * SCHNELLE Zugfindung mit Timeout-Schutz
 */
export function findBestMove(
  board: Board,
  aiPlayer: Player,
): { from: Position; to: Position } | null {
  resetTimeout();

  console.log("🔍 Bot sucht besten Zug...");
  const startTime = performance.now();

  try {
    // Hole alle möglichen Züge (ohne tiefe Check-Validierung)
    const allMoves = getQuickMoves(board, aiPlayer);

    if (allMoves.length === 0) {
      console.warn("⚠️ Keine Züge verfügbar!");
      return null;
    }

    console.log(`📋 ${allMoves.length} mögliche Züge`);

    // Limitiere auf erste 30 Züge für Performance
    const moves = allMoves.slice(0, Math.min(allMoves.length, 30));

    let bestMove = moves[0];
    let bestValue = -Infinity;

    // Nur Tiefe 2 für schnelle Antwort
    const maxDepth = 2;

    for (const move of moves) {
      if (checkTimeout()) {
        console.log("⏸️ Timeout - nutze bisherigen besten Zug");
        break;
      }

      const newBoard = makeMove(board, move.from, move.to);

      // Schnelle Evaluation
      let moveValue = minimax(
        newBoard,
        maxDepth - 1,
        false,
        -Infinity,
        Infinity,
        aiPlayer,
      );

      // Bonus für Captures
      const capturedPiece = board[move.to.row][move.to.col];
      if (capturedPiece) {
        moveValue += PIECE_VALUES[capturedPiece.type] / 5;
      }

      if (moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`⏱️ Fertig in ${duration.toFixed(2)}s`);
    console.log(`🎯 Best: ${bestValue.toFixed(0)}, Nodes: ${nodesEvaluated}`);

    return { from: bestMove.from, to: bestMove.to };
  } catch (error) {
    console.error("❌ Fehler bei Zugsuche:", error);

    // Fallback: Nimm ersten gültigen Zug
    const quickMoves = getQuickMoves(board, aiPlayer);
    if (quickMoves.length > 0) {
      return { from: quickMoves[0].from, to: quickMoves[0].to };
    }

    return null;
  }
}
