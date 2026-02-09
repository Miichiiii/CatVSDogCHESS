"use client";

import React from "react";
import type { ChessPiece, Position } from "@/lib/chess-types";
import ChessSquare from "./chess-square";

interface ChessBoardProps {
  board: (ChessPiece | null)[][];
  selectedPiece: Position | null;
  validMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  onSquareClick: (position: Position) => void;
}

export default function ChessBoard({
  board,
  selectedPiece,
  validMoves,
  lastMove,
  onSquareClick,
}: ChessBoardProps) {
  const isValidMove = (row: number, col: number) => {
    return validMoves.some((move) => move.row === row && move.col === col);
  };

  const isSelected = (row: number, col: number) => {
    return selectedPiece?.row === row && selectedPiece?.col === col;
  };

  const isLastMove = (row: number, col: number) => {
    if (!lastMove) return false;
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
  };

  // Generate column labels (a-h)
  const columnLabels = Array.from({ length: 8 }, (_, i) =>
    String.fromCharCode(97 + i),
  );

  // Generate row labels (1-8)
  const rowLabels = Array.from({ length: 8 }, (_, i) => 8 - i);

  return (
    <div className="relative p-2 sm:p-4">
      <div className="grid grid-cols-[auto_repeat(8,minmax(30px,1fr))] sm:grid-cols-[auto_repeat(8,minmax(50px,1fr))] grid-rows-[repeat(8,minmax(30px,1fr))_auto] sm:grid-rows-[repeat(8,minmax(50px,1fr))_auto] gap-0">
        {/* Empty top-left corner */}
        <div className="w-5 sm:w-6"></div>

        {/* Column labels (top) */}
        {columnLabels.map((label) => (
          <div
            key={`top-${label}`}
            className="flex justify-center items-center h-5 sm:h-6 text-xs sm:text-sm font-semibold text-gray-600"
          >
            {label}
          </div>
        ))}

        {/* Board with row labels */}
        {board.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {/* Row label */}
            <div
              key={`label-${rowIndex}`}
              className="flex justify-center items-center w-5 sm:w-6 text-xs sm:text-sm font-semibold text-gray-600"
            >
              {rowLabels[rowIndex]}
            </div>

            {/* Chess squares */}
            {row.map((piece, colIndex) => (
              <ChessSquare
                key={`${rowIndex}-${colIndex}`}
                piece={piece}
                position={{ row: rowIndex, col: colIndex }}
                isLight={(rowIndex + colIndex) % 2 === 0}
                isSelected={isSelected(rowIndex, colIndex)}
                isValidMove={isValidMove(rowIndex, colIndex)}
                isLastMove={isLastMove(rowIndex, colIndex)}
                onClick={() => onSquareClick({ row: rowIndex, col: colIndex })}
              />
            ))}
          </React.Fragment>
        ))}

        {/* Empty bottom-left corner */}
        <div className="w-5 sm:w-6"></div>

        {/* Column labels (bottom) */}
        {columnLabels.map((label) => (
          <div
            key={`bottom-${label}`}
            className="flex justify-center items-center h-5 sm:h-6 text-xs sm:text-sm font-semibold text-gray-600"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
