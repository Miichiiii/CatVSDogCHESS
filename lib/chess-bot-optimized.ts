import {
  type Board,
  type Position,
  type Player,
  type PieceType,
  getAllLegalMoves,
  makeMove,
  isCheckmate,
  isInCheck,
  getValidMoves,
} from "./chess-logic";

// Piece-Werte für Evaluation
const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

// Position-Bonusse für bessere Figurenplatzierung
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

interface BotConfig {
  maxTimeMs: number;
  maxDepth: number;
  personality: "aggressive" | "defensive" | "balanced";
}

const DEFAULT_CONFIG: BotConfig = {
  maxTimeMs: 3000,
  maxDepth: 4,
  personality: "balanced",
};

let timeoutStart = 0;
let isTimeUp = false;

function resetTimeout(): void {
  isTimeUp = false;
  timeoutStart = Date.now();
}

function checkTimeout(config: BotConfig): boolean {
  if (isTimeUp) return true;
  const elapsed = Date.now() - timeoutStart;
  if (elapsed > config.maxTimeMs) {
    isTimeUp = true;
    return true;
  }
  return false;
}

/**
 * Bewerte die Brettposition aus Sicht des Bots
 */
function evaluateBoard(board: Board, botPlayer: Player): number {
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const pieceValue = PIECE_VALUES[piece.type];
      let positionBonus = 0;

      // Position bonus für Bauern
      if (piece.type === "pawn") {
        const adjustedRow = piece.player === "dogs" ? row : 7 - row;
        positionBonus = PAWN_POSITION_BONUS[adjustedRow]?.[col] || 0;
      }

      const pieceScore = pieceValue + positionBonus;

      if (piece.player === botPlayer) {
        score += pieceScore;
      } else {
        score -= pieceScore;
      }
    }
  }

  return score;
}

/**
 * Minimax mit Alpha-Beta Pruning und Timeout
 */
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  botPlayer: Player,
  config: BotConfig,
): number {
  // Timeout-Check alle 100 Knoten
  if (depth % 2 === 0 && checkTimeout(config)) {
    return evaluateBoard(board, botPlayer);
  }

  if (depth === 0) {
    return evaluateBoard(board, botPlayer);
  }

  const currentPlayer = isMaximizing
    ? botPlayer
    : botPlayer === "cats"
      ? "dogs"
      : "cats";
  const legalMoves = getAllLegalMoves(board, currentPlayer);

  // Keine Züge verfügbar
  if (legalMoves.length === 0) {
    if (isInCheck(board, currentPlayer)) {
      return isMaximizing ? -100000 - depth : 100000 + depth;
    }
    return 0; // Patt
  }

  if (isMaximizing) {
    let value = -Infinity;
    for (const move of legalMoves) {
      if (checkTimeout(config)) break;

      const newBoard = makeMove(board, move.from, move.to);
      let moveValue = minimax(
        newBoard,
        depth - 1,
        alpha,
        beta,
        false,
        botPlayer,
        config,
      );

      // Bonus für Schachmatt
      if (isCheckmate(newBoard, botPlayer === "cats" ? "dogs" : "cats")) {
        moveValue += 10000;
      }

      value = Math.max(value, moveValue);
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  } else {
    let value = Infinity;
    for (const move of legalMoves) {
      if (checkTimeout(config)) break;

      const newBoard = makeMove(board, move.from, move.to);
      const moveValue = minimax(
        newBoard,
        depth - 1,
        alpha,
        beta,
        true,
        botPlayer,
        config,
      );

      value = Math.min(value, moveValue);
      beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  }
}

/**
 * Finde den besten Zug mit Zeit-Limit (maximal 3 Sekunden)
 */
export function calculateBotMove(
  board: Board,
  botPlayer: Player,
  config: Partial<BotConfig> = {},
): { from: Position; to: Position } | null {
  const finalConfig: BotConfig = { ...DEFAULT_CONFIG, ...config };
  resetTimeout();

  const legalMoves = getAllLegalMoves(board, botPlayer);

  if (legalMoves.length === 0) {
    return null;
  }

  // Iterative Deepening mit Timeout
  let bestMove = legalMoves[0];
  let bestScore = -Infinity;

  for (let depth = 1; depth <= finalConfig.maxDepth; depth++) {
    if (checkTimeout(finalConfig)) break;

    isTimeUp = false; // Reset für neue Tiefe
    let depthBestMove = legalMoves[0];
    let depthBestScore = -Infinity;

    for (const move of legalMoves) {
      if (checkTimeout(finalConfig)) break;

      const newBoard = makeMove(board, move.from, move.to);
      let moveScore = -minimax(
        newBoard,
        depth - 1,
        -Infinity,
        Infinity,
        false,
        botPlayer,
        finalConfig,
      );

      // Bonus für Checks
      const opponent = botPlayer === "cats" ? "dogs" : "cats";
      if (isInCheck(newBoard, opponent)) {
        moveScore += 100;
      }

      // Bonus für Schachmatt
      if (isCheckmate(newBoard, opponent)) {
        moveScore += 100000;
      }

      // Personality-Modifizierer
      if (finalConfig.personality === "aggressive") {
        const targetPiece = board[move.to.row][move.to.col];
        if (targetPiece) {
          moveScore += 150;
        }
      }

      if (moveScore > depthBestScore) {
        depthBestScore = moveScore;
        depthBestMove = move;
      }
    }

    // Nur aktualisieren wenn besserer Zug gefunden
    if (depthBestScore > bestScore) {
      bestScore = depthBestScore;
      bestMove = depthBestMove;
    }

    if (checkTimeout(finalConfig)) break;
  }

  return { from: bestMove.from, to: bestMove.to };
}

/**
 * Schnelle Zugbewertung (für UI-Hints)
 */
export function quickEvaluateMove(
  board: Board,
  from: Position,
  to: Position,
  player: Player,
): number {
  const newBoard = makeMove(board, from, to);
  let score = evaluateBoard(newBoard, player);

  const targetPiece = board[to.row][to.col];
  if (targetPiece) {
    score += PIECE_VALUES[targetPiece.type];
  }

  const opponent = player === "cats" ? "dogs" : "cats";
  if (isCheckmate(newBoard, opponent)) {
    score += 100000;
  } else if (isInCheck(newBoard, opponent)) {
    score += 500;
  }

  return score;
}
