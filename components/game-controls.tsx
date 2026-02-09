"use client";

import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  AlertTriangle,
  Trophy,
  Handshake,
  Undo2,
  Redo2,
  Maximize,
  Minimize,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface GameControlsProps {
  onReset: () => void;
  gameStatus: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function GameControls({
  onReset,
  gameStatus,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: GameControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check fullscreen status on mount and listen for changes
  useEffect(() => {
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    checkFullscreen();
    document.addEventListener("fullscreenchange", checkFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", checkFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-4 w-full sm:w-auto">
      <div className="flex gap-2 w-full sm:w-auto">
        {onUndo && (
          <Button
            onClick={onUndo}
            disabled={!canUndo}
            variant="outline"
            className="flex-1 sm:flex-none flex items-center gap-2"
            title="Undo last move"
          >
            <Undo2 className="h-4 w-4" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
        )}
        {onRedo && (
          <Button
            onClick={onRedo}
            disabled={!canRedo}
            variant="outline"
            className="flex-1 sm:flex-none flex items-center gap-2"
            title="Redo move"
          >
            <Redo2 className="h-4 w-4" />
            <span className="hidden sm:inline">Redo</span>
          </Button>
        )}
      </div>
      <Button
        onClick={toggleFullscreen}
        variant="outline"
        className="w-full sm:w-auto flex items-center gap-2"
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <>
            <Minimize className="h-5 w-5" />
            <span className="hidden sm:inline">Exit Fullscreen</span>
          </>
        ) : (
          <>
            <Maximize className="h-5 w-5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </>
        )}
      </Button>
      <Button
        onClick={onReset}
        className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2 h-auto"
      >
        <RefreshCw className="h-5 w-5" />
        New Game
      </Button>

      {gameStatus.includes("checkmate") && (
        <Card className="w-full sm:w-auto p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-300">
          <div className="flex items-center gap-2 text-lg font-bold text-red-700">
            <Trophy className="h-5 w-5" />
            <span>
              Checkmate!{" "}
              {gameStatus.split("-")[1] === "white" ? "🐕 Dogs" : "😸 Cats"}{" "}
              win!
            </span>
          </div>
        </Card>
      )}

      {gameStatus === "stalemate" && (
        <Card className="w-full sm:w-auto p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300">
          <div className="flex items-center gap-2 text-lg font-bold text-amber-700">
            <Handshake className="h-5 w-5" />
            <span>Stalemate! The game is a draw.</span>
          </div>
        </Card>
      )}

      {gameStatus.includes("check") && !gameStatus.includes("checkmate") && (
        <Card className="w-full sm:w-auto p-3 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300">
          <div className="flex items-center gap-2 text-base font-semibold text-orange-700">
            <AlertTriangle className="h-4 w-4" />
            <span>⚠️ Check!</span>
          </div>
        </Card>
      )}
    </div>
  );
}
