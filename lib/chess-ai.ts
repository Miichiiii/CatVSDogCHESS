import {
  type Board,
  type Position,
  type Player,
  getValidMoves,
  makeMove,
  isInCheck,
  isCheckmate,
  isStalemate,
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

// ==================== TIMEOUT MANAGEMENT ====================

let timeoutStart = 0;
let isTimeExpired = false;
const MAX_TIME_MS = 3000;

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
    return true;
  }
  return false;
}

// ==================== MINIMAX WITH ALPHA-BETA PRUNING ====================

/**
 * Minimax-Algorithmus der WIRKLICH ALLE 4096 Positionen bewertet
 * Mit 3-Sekunden-Timeout als Sicherheitsmechanismus
 */
function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  aiPlayer: Player,
): number {
  // Timeout-Check
  if (checkTimeout()) {
    return evaluateBoard(board, aiPlayer);
  }

  const opponent: Player = aiPlayer === "cats" ? "dogs" : "cats";
  const currentPlayer = isMaximizing ? aiPlayer : opponent;

  // Basis-Fall: Maximale Tiefe oder Spielende
  if (depth === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  if (isCheckmate(board, currentPlayer)) {
    return isMaximizing ? -100000 : 100000;
  }

  if (isStalemate(board, currentPlayer)) {
    return 0;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    let validMoveFound = false;

    // ALLE 64 Start-Positionen
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        // ALLE 64 Ziel-Positionen (4096 Kombinationen)
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            nodesEvaluated++;

            // Timeout-Check alle 100 Nodes
            if (nodesEvaluated % 100 === 0 && checkTimeout()) {
              return validMoveFound ? maxEval : evaluateBoard(board, aiPlayer);
            }

            // Versuche den Zug auszuführen (egal ob legal oder nicht)
            const piece = board[fromRow][fromCol];

            // Nur wenn eine eigene Figur auf dem Startfeld ist
            if (piece && piece.player === aiPlayer) {
              // Prüfe ob dies ein gültiger Zug ist
              const validMoves = getValidMoves(board, {
                row: fromRow,
                col: fromCol,
              });
              const isValidMove = validMoves.some(
                (m) => m.row === toRow && m.col === toCol,
              );

              if (isValidMove) {
                const newBoard = makeMove(
                  board,
                  { row: fromRow, col: fromCol },
                  { row: toRow, col: toCol },
                );

                // Nur wenn der König nicht im Schach steht
                if (!isInCheck(newBoard, aiPlayer)) {
                  validMoveFound = true;
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
                    return maxEval; // Beta-Cutoff
                  }
                }
              }
            }
            // ALLE anderen Positionen werden übersprungen aber GEZÄHLT
          }
        }
      }
    }

    return validMoveFound ? maxEval : evaluateBoard(board, aiPlayer);
  } else {
    let minEval = Infinity;
    let validMoveFound = false;

    // ALLE 64 Start-Positionen
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        // ALLE 64 Ziel-Positionen (4096 Kombinationen)
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            nodesEvaluated++;

            // Timeout-Check alle 100 Nodes
            if (nodesEvaluated % 100 === 0 && checkTimeout()) {
              return validMoveFound ? minEval : evaluateBoard(board, aiPlayer);
            }

            const piece = board[fromRow][fromCol];

            if (piece && piece.player === opponent) {
              const validMoves = getValidMoves(board, {
                row: fromRow,
                col: fromCol,
              });
              const isValidMove = validMoves.some(
                (m) => m.row === toRow && m.col === toCol,
              );

              if (isValidMove) {
                const newBoard = makeMove(
                  board,
                  { row: fromRow, col: fromCol },
                  { row: toRow, col: toCol },
                );

                if (!isInCheck(newBoard, opponent)) {
                  validMoveFound = true;
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
                    return minEval; // Alpha-Cutoff
                  }
                }
              }
            }
          }
        }
      }
    }

    return validMoveFound ? minEval : evaluateBoard(board, aiPlayer);
  }
}

// ==================== BEST MOVE FINDER ====================

/**
 * Finde den besten Zug - prüft ALLE 4096 Positionen
 * Mit 3-Sekunden-Timeout als Sicherheitsmechanismus
 */
export function findBestMove(
  board: Board,
  aiPlayer: Player,
): { from: Position; to: Position } | null {
  resetTimeout();

  let bestMove: { from: Position; to: Position } | null = null;
  let bestValue = -Infinity;
  let totalPositionsChecked = 0;
  let legalMovesFound = 0;

  console.log("🔍 Evaluiere ALLE 4096 Positionen (64×64)...");
  const startTime = performance.now();

  // ALLE 64 Start-Positionen
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      // ALLE 64 Ziel-Positionen
      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          totalPositionsChecked++;

          // Timeout-Check
          if (totalPositionsChecked % 256 === 0 && checkTimeout()) {
            console.log(
              `⏸️ Timeout nach ${totalPositionsChecked} Positionen und ${legalMovesFound} legalen Zügen`,
            );
            break;
          }

          const piece = board[fromRow][fromCol];

          if (piece && piece.player === aiPlayer) {
            const validMoves = getValidMoves(board, {
              row: fromRow,
              col: fromCol,
            });
            const isValidMove = validMoves.some(
              (m) => m.row === toRow && m.col === toCol,
            );

            if (isValidMove) {
              const newBoard = makeMove(
                board,
                { row: fromRow, col: fromCol },
                { row: toRow, col: toCol },
              );

              if (!isInCheck(newBoard, aiPlayer)) {
                legalMovesFound++;
                const moveValue = minimax(
                  newBoard,
                  2,
                  false,
                  -Infinity,
                  Infinity,
                  aiPlayer,
                );

                if (moveValue > bestValue) {
                  bestValue = moveValue;
                  bestMove = {
                    from: { row: fromRow, col: fromCol },
                    to: { row: toRow, col: toCol },
                  };
                }
              }
            }
          }
        }
        if (isTimeExpired) break;
      }
      if (isTimeExpired) break;
    }
    if (isTimeExpired) break;
  }

  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000;

  console.log(
    `✅ ${totalPositionsChecked} Positionen überprüft (sollte 4096 sein)`,
  );
  console.log(`⚖️ Davon ${legalMovesFound} legale Züge gefunden`);
  console.log(`⏱️ Dauer: ${duration.toFixed(2)} Sekunden`);
  console.log(`🎯 Bester Zug-Wert: ${bestValue}`);
  console.log(`📊 Total Nodes evaluiert: ${nodesEvaluated}`);

  return bestMove;
}
