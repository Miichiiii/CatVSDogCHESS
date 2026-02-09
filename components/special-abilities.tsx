"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Zap, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PieceColor } from "@/lib/chess-types";

interface SpecialAbilitiesProps {
  currentPlayer: PieceColor;
  laserPointerCount: number;
  boneCount: number;
  onUseLaserPointer: () => void;
  onUseBone: () => void;
  isLaserPointerActive: boolean;
  isBoneActive: boolean;
  crazyMode: boolean;
}

export default function SpecialAbilities({
  currentPlayer,
  laserPointerCount,
  boneCount,
  onUseLaserPointer,
  onUseBone,
  isLaserPointerActive,
  isBoneActive,
  crazyMode,
}: SpecialAbilitiesProps) {
  if (!crazyMode) return null;

  return (
    <div className="mt-4 p-4 sm:p-5 border rounded-lg bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-bold text-purple-900">
          ⚡ Special Abilities
        </h3>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2">
              <Info className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>🎮 Crazy Mode Special Abilities</DialogTitle>
              <DialogDescription>
                Learn how to use special abilities to outsmart your opponent!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">
                  🔦 Laser Pointer (For Dogs)
                </h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-blue-800">
                  <li>
                    <strong>Who can use:</strong> White (Dogs) against Black
                    (Cats)
                  </li>
                  <li>
                    <strong>Uses:</strong> 1-3x per game (set in game settings)
                  </li>
                  <li>
                    <strong>How:</strong> Click "Activate", then click any
                    square
                  </li>
                  <li>
                    <strong>Effect:</strong> The nearest black piece moves to
                    that square
                  </li>
                  <li>
                    <strong>Strategy:</strong> Lure cats into bad positions!
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2">
                  🦴 Bone (For Cats)
                </h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-amber-800">
                  <li>
                    <strong>Who can use:</strong> Black (Cats) against White
                    (Dogs)
                  </li>
                  <li>
                    <strong>Uses:</strong> 1-3x per game (set in game settings)
                  </li>
                  <li>
                    <strong>How:</strong> Click "Place", then click any square
                  </li>
                  <li>
                    <strong>Effect:</strong> The nearest white piece moves to
                    that square
                  </li>
                  <li>
                    <strong>Strategy:</strong> Trap your opponent or rescue your
                    pieces!
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-bold text-purple-900 mb-2">
                  ⚠️ Important Notes
                </h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-purple-800">
                  <li>
                    Each ability can be used 1-3 times (set before game starts)
                  </li>
                  <li>After activation, you must click on a square</li>
                  <li>
                    The movement happens automatically to the nearest piece
                  </li>
                  <li>
                    Using an ability counts as your turn - opponent plays next!
                  </li>
                  <li>
                    These moves can dramatically change the game - use them
                    wisely!
                  </li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Laser Pointer - White (Dogs) uses against Black (Cats) */}
        <div className="space-y-2 p-3 bg-white rounded-lg border border-blue-200">
          <div className="text-sm font-semibold text-blue-700">
            🔦 Laser Pointer
          </div>
          <Button
            onClick={onUseLaserPointer}
            disabled={
              laserPointerCount === 0 ||
              currentPlayer !== PieceColor.WHITE ||
              isLaserPointerActive
            }
            variant={isLaserPointerActive ? "default" : "outline"}
            className={`w-full text-sm ${isLaserPointerActive ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isLaserPointerActive
              ? "Click to place..."
              : `Activate (${laserPointerCount}x)`}
          </Button>
          <div className="text-xs text-center text-gray-600">
            For White (Dogs)
          </div>
        </div>

        {/* Bone - Black (Cats) uses against White (Dogs) */}
        <div className="space-y-2 p-3 bg-white rounded-lg border border-amber-200">
          <div className="text-sm font-semibold text-amber-700">🦴 Bone</div>
          <Button
            onClick={onUseBone}
            disabled={
              boneCount === 0 ||
              currentPlayer !== PieceColor.BLACK ||
              isBoneActive
            }
            variant={isBoneActive ? "default" : "outline"}
            className={`w-full text-sm ${isBoneActive ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isBoneActive ? "Click to place..." : `Place (${boneCount}x)`}
          </Button>
          <div className="text-xs text-center text-gray-600">
            For Black (Cats)
          </div>
        </div>
      </div>

      {(isLaserPointerActive || isBoneActive) && (
        <div className="mt-3 p-3 bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800 text-center font-medium">
          ⚡{" "}
          {isLaserPointerActive
            ? "Click a square to place the Laser Pointer!"
            : "Click a square to place the Bone!"}
        </div>
      )}
    </div>
  );
}
