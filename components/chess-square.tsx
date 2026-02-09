"use client";

import { useState, useEffect } from "react";
import type { ChessPiece, Position } from "@/lib/chess-types";
import { getPieceOverlaySymbol, getPieceImagePath } from "@/lib/chess-utils";
import { PieceType, PieceColor } from "@/lib/chess-types";
import { cn } from "@/lib/utils";

interface ChessSquareProps {
  piece: ChessPiece | null;
  position: Position;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isLastMove: boolean;
  onClick: () => void;
}

export default function ChessSquare({
  piece,
  position,
  isLight,
  isSelected,
  isValidMove,
  isLastMove,
  onClick,
}: ChessSquareProps) {
  const [animationFrame, setAnimationFrame] = useState(1);
  const [imageError, setImageError] = useState(false);

  // Berechne eindeutige Animations-Parameter basierend auf Position
  const getAnimationParams = () => {
    const speeds = [3000, 4000, 5000, 6000, 3500, 4500, 5500, 6500];
    const baseSpeed = speeds[position.col];
    const selectedSpeed = 300 + (position.col % 4) * 50; // 300, 350, 400, 450ms
    return { baseSpeed, selectedSpeed };
  };

  const { baseSpeed, selectedSpeed } = getAnimationParams();

  // Animation für alle Bauern - immer aktiv, aber unterschiedliche Geschwindigkeit pro Position
  useEffect(() => {
    if (piece?.type === PieceType.PAWN) {
      // Schnellere Animation wenn ausgewählt, langsamer wenn nicht ausgewählt
      const animationSpeed = isSelected ? selectedSpeed : baseSpeed;

      const interval = setInterval(() => {
        setAnimationFrame((prev) => (prev === 1 ? 2 : 1));
        setImageError(false); // Reset error state when frame changes
      }, animationSpeed);

      return () => clearInterval(interval);
    } else {
      setAnimationFrame(1); // Reset zur Standardpose
      setImageError(false); // Reset error state
    }
  }, [isSelected, piece, baseSpeed, selectedSpeed]);

  const getPieceImage = () => {
    if (!piece) return "/placeholder.svg";

    // Weiße Bauern: unterschiedliche Geschwindigkeiten pro Spalte
    if (piece.type === PieceType.PAWN && piece.color === PieceColor.WHITE) {
      const images = ["white pawn.png", "white pawn 2.png"];
      return `/pieces/${images[animationFrame - 1]}`;
    }

    // Schwarze Bauern: unterschiedliche Animationen pro Spalte
    if (piece.type === PieceType.PAWN && piece.color === PieceColor.BLACK) {
      if (isSelected) {
        const animations: { [key: number]: string[] } = {
          0: ["black pawn.png", "black pawn 3.png"],
          1: ["black pawn.png", "black pawn 3.png"],
          2: ["black pawn.png", "black pawn 3.png"],
          3: ["black pawn.png", "black pawn 3.png"],
          4: ["black pawn.png", "black pawn 3.png"],
          5: ["black pawn.png", "black pawn 3.png"],
          6: ["black pawn.png", "black pawn 3.png"],
          7: ["black pawn.png", "black pawn 3.png"],
        };
        const images = animations[position.col];
        return `/pieces/${images[animationFrame - 1]}`;
      } else {
        const animations: { [key: number]: string[] } = {
          0: ["black pawn.png", "black pawn1.png"],
          1: ["black pawn.png", "black pawn1.png"],
          2: ["black pawn.png", "black pawn1.png"],
          3: ["black pawn.png", "black pawn1.png"],
          4: ["black pawn.png", "black pawn1.png"],
          5: ["black pawn.png", "black pawn1.png"],
          6: ["black pawn.png", "black pawn1.png"],
          7: ["black pawn.png", "black pawn1.png"],
        };
        const images = animations[position.col];
        return `/pieces/${images[animationFrame - 1]}`;
      }
    }

    return getPieceImagePath(piece) || "/placeholder.svg";
  };

  const handleImageError = () => {
    console.error(`Failed to load image: ${getPieceImage()}`);
    setImageError(true);
  };

  return (
    <div
      className={cn(
        "w-full aspect-square flex items-center justify-center relative cursor-pointer overflow-hidden",
        "transition-all duration-200 ease-in-out",
        isLight ? "bg-amber-100" : "bg-amber-800",
        isSelected && "bg-yellow-300 ring-4 ring-yellow-400 ring-opacity-60",
        isLastMove &&
          !isSelected &&
          (isLight ? "bg-green-200" : "bg-green-600"),
        "hover:brightness-110 active:brightness-95",
      )}
      onClick={onClick}
      data-position={`${position.row}-${position.col}`}
    >
      {piece && (
        <div
          className={cn(
            "relative w-full h-full flex items-center justify-center",
            "transition-transform duration-300 ease-out",
            isSelected && "scale-105",
            "hover:scale-110",
          )}
        >
          {!imageError ? (
            <img
              src={getPieceImage()}
              alt={`${piece.color} ${piece.type}`}
              className={cn(
                "w-[85%] h-[85%] object-cover rounded-sm select-none pointer-events-none",
                "transition-all duration-300 ease-out",
                "drop-shadow-md",
              )}
              draggable={false}
              onError={handleImageError}
            />
          ) : (
            <div
              className={cn(
                "text-4xl md:text-5xl select-none",
                "transition-transform duration-300 ease-out",
                isSelected && "scale-110",
              )}
            >
              {getPieceOverlaySymbol(piece)}
            </div>
          )}
          <span
            className={cn(
              "absolute bottom-0 right-0 text-[10px] md:text-xs leading-none font-bold select-none",
              "bg-black/60 text-white rounded-tl-sm px-[3px] py-[1px]",
              "transition-opacity duration-200",
              isSelected && "opacity-80",
            )}
          >
            {getPieceOverlaySymbol(piece)}
          </span>
        </div>
      )}

      {isValidMove && !piece && (
        <div className="absolute w-3 h-3 rounded-full bg-gray-500 opacity-50 animate-pulse"></div>
      )}

      {isValidMove && piece && (
        <div className="absolute inset-0 border-4 border-gray-500 opacity-50 rounded-sm animate-pulse"></div>
      )}
    </div>
  );
}
