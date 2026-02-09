export type PieceType =
  | "pawn"
  | "rook"
  | "knight"
  | "bishop"
  | "queen"
  | "king";
export type Player = "cats" | "dogs";

export interface Piece {
  type: PieceType;
  player: Player;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export type Board = (Piece | null)[][];

// Initialisiere das Schachbrett
export function initializeBoard(): Board {
  const board: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Dogs (weiß) - untere Reihen
  const dogsBackRow: PieceType[] = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];
  for (let col = 0; col < 8; col++) {
    board[7][col] = { type: dogsBackRow[col], player: "dogs" };
    board[6][col] = { type: "pawn", player: "dogs" };
  }

  // Cats (schwarz) - obere Reihen
  const catsBackRow: PieceType[] = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: catsBackRow[col], player: "cats" };
    board[1][col] = { type: "pawn", player: "cats" };
  }

  return board;
}

// Prüfe ob eine Position auf dem Brett ist
function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Hole gültige Züge für Bauern
function getPawnMoves(board: Board, from: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const direction = piece.player === "dogs" ? -1 : 1;
  const startRow = piece.player === "dogs" ? 6 : 1;

  // Ein Feld vorwärts
  const oneForward = from.row + direction;
  if (isInBounds(oneForward, from.col) && !board[oneForward][from.col]) {
    moves.push({ row: oneForward, col: from.col });

    // Zwei Felder vorwärts (nur vom Startfeld)
    if (from.row === startRow) {
      const twoForward = from.row + 2 * direction;
      if (!board[twoForward][from.col]) {
        moves.push({ row: twoForward, col: from.col });
      }
    }
  }

  // Schlagen diagonal
  const captures = [
    { row: from.row + direction, col: from.col - 1 },
    { row: from.row + direction, col: from.col + 1 },
  ];

  for (const cap of captures) {
    if (isInBounds(cap.row, cap.col)) {
      const target = board[cap.row][cap.col];
      if (target && target.player !== piece.player) {
        moves.push(cap);
      }
    }
  }

  return moves;
}

// Hole gültige Züge für Türme
function getRookMoves(board: Board, from: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const directions = [
    { row: 1, col: 0 },
    { row: -1, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: -1 },
  ];

  for (const dir of directions) {
    let row = from.row + dir.row;
    let col = from.col + dir.col;

    while (isInBounds(row, col)) {
      const target = board[row][col];

      if (!target) {
        moves.push({ row, col });
      } else {
        if (target.player !== piece.player) {
          moves.push({ row, col });
        }
        break;
      }

      row += dir.row;
      col += dir.col;
    }
  }

  return moves;
}

// Hole gültige Züge für Springer
function getKnightMoves(
  board: Board,
  from: Position,
  piece: Piece,
): Position[] {
  const moves: Position[] = [];
  const offsets = [
    { row: -2, col: -1 },
    { row: -2, col: 1 },
    { row: -1, col: -2 },
    { row: -1, col: 2 },
    { row: 1, col: -2 },
    { row: 1, col: 2 },
    { row: 2, col: -1 },
    { row: 2, col: 1 },
  ];

  for (const offset of offsets) {
    const row = from.row + offset.row;
    const col = from.col + offset.col;

    if (isInBounds(row, col)) {
      const target = board[row][col];
      if (!target || target.player !== piece.player) {
        moves.push({ row, col });
      }
    }
  }

  return moves;
}

// Hole gültige Züge für Läufer
function getBishopMoves(
  board: Board,
  from: Position,
  piece: Piece,
): Position[] {
  const moves: Position[] = [];
  const directions = [
    { row: 1, col: 1 },
    { row: 1, col: -1 },
    { row: -1, col: 1 },
    { row: -1, col: -1 },
  ];

  for (const dir of directions) {
    let row = from.row + dir.row;
    let col = from.col + dir.col;

    while (isInBounds(row, col)) {
      const target = board[row][col];

      if (!target) {
        moves.push({ row, col });
      } else {
        if (target.player !== piece.player) {
          moves.push({ row, col });
        }
        break;
      }

      row += dir.row;
      col += dir.col;
    }
  }

  return moves;
}

// Hole gültige Züge für Königin
function getQueenMoves(board: Board, from: Position, piece: Piece): Position[] {
  return [
    ...getRookMoves(board, from, piece),
    ...getBishopMoves(board, from, piece),
  ];
}

// Hole gültige Züge für König
function getKingMoves(board: Board, from: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const offsets = [
    { row: -1, col: -1 },
    { row: -1, col: 0 },
    { row: -1, col: 1 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ];

  for (const offset of offsets) {
    const row = from.row + offset.row;
    const col = from.col + offset.col;

    if (isInBounds(row, col)) {
      const target = board[row][col];
      if (!target || target.player !== piece.player) {
        moves.push({ row, col });
      }
    }
  }

  return moves;
}

// Hauptfunktion: Hole alle gültigen Züge für eine Figur
export function getValidMoves(board: Board, from: Position): Position[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  let moves: Position[] = [];

  switch (piece.type) {
    case "pawn":
      moves = getPawnMoves(board, from, piece);
      break;
    case "rook":
      moves = getRookMoves(board, from, piece);
      break;
    case "knight":
      moves = getKnightMoves(board, from, piece);
      break;
    case "bishop":
      moves = getBishopMoves(board, from, piece);
      break;
    case "queen":
      moves = getQueenMoves(board, from, piece);
      break;
    case "king":
      moves = getKingMoves(board, from, piece);
      break;
  }

  return moves;
}

// Führe einen Zug aus
export function makeMove(board: Board, from: Position, to: Position): Board {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[from.row][from.col];

  if (piece) {
    newBoard[to.row][to.col] = { ...piece, hasMoved: true };
    newBoard[from.row][from.col] = null;

    // Bauernumwandlung
    if (piece.type === "pawn") {
      if (
        (piece.player === "dogs" && to.row === 0) ||
        (piece.player === "cats" && to.row === 7)
      ) {
        newBoard[to.row][to.col] = {
          type: "queen",
          player: piece.player,
          hasMoved: true,
        };
      }
    }
  }

  return newBoard;
}

// Prüfe ob ein Spieler im Schach steht
export function isInCheck(board: Board, player: Player): boolean {
  let kingPos: Position | null = null;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === "king" && piece.player === player) {
        kingPos = { row, col };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return false;

  // Prüfe ob irgendeine gegnerische Figur den König schlagen könnte
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.player !== player) {
        const moves = getValidMoves(board, { row, col });
        if (
          moves.some((m) => m.row === kingPos!.row && m.col === kingPos!.col)
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

// Prüfe ob Schachmatt
export function isCheckmate(board: Board, player: Player): boolean {
  if (!isInCheck(board, player)) return false;

  // Prüfe ob irgendein Zug das Schach beenden würde
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.player === player) {
        const moves = getValidMoves(board, { row: fromRow, col: fromCol });

        for (const move of moves) {
          const newBoard = makeMove(
            board,
            { row: fromRow, col: fromCol },
            move,
          );
          if (!isInCheck(newBoard, player)) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

// Prüfe ob Patt
export function isStalemate(board: Board, player: Player): boolean {
  if (isInCheck(board, player)) return false;

  // Prüfe ob der Spieler irgendwelche gültigen Züge hat
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.player === player) {
        const moves = getValidMoves(board, { row: fromRow, col: fromCol });

        for (const move of moves) {
          const newBoard = makeMove(
            board,
            { row: fromRow, col: fromCol },
            move,
          );
          if (!isInCheck(newBoard, player)) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

// Hole alle legalen Züge für einen Spieler
export function getAllLegalMoves(
  board: Board,
  player: Player,
): Array<{ from: Position; to: Position }> {
  const legalMoves: Array<{ from: Position; to: Position }> = [];

  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.player === player) {
        const from = { row: fromRow, col: fromCol };
        const moves = getValidMoves(board, from);

        for (const to of moves) {
          const newBoard = makeMove(board, from, to);
          if (!isInCheck(newBoard, player)) {
            legalMoves.push({ from, to });
          }
        }
      }
    }
  }

  return legalMoves;
}
