"use client";

import { PieceColor, type ChessPiece } from "@/lib/chess-types";
import {
  getPieceSymbol,
  getPieceImagePath,
  getPieceOverlaySymbol,
} from "@/lib/chess-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GameInfoProps {
  currentPlayer: PieceColor;
  gameStatus: string;
  moveHistory: string[];
  capturedPieces: {
    [PieceColor.WHITE]: ChessPiece[];
    [PieceColor.BLACK]: ChessPiece[];
  };
  isBotThinking?: boolean;
}

export default function GameInfo({
  currentPlayer,
  gameStatus,
  moveHistory,
  capturedPieces,
  isBotThinking = false,
}: GameInfoProps) {
  const currentEmoji = currentPlayer === PieceColor.WHITE ? "🐕" : "😸";
  const currentLabel =
    currentPlayer === PieceColor.WHITE ? "Dogs (White)" : "Cats (Black)";

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg text-blue-900">
            {currentEmoji} Current Turn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`w-5 h-5 rounded-full ${currentPlayer === PieceColor.WHITE ? "bg-white border-2 border-blue-400" : "bg-black"}`}
            ></div>
            <span className="font-bold text-blue-900">{currentLabel}</span>
          </div>

          {gameStatus === "ongoing" ? (
            <p className="text-sm text-blue-700">
              {isBotThinking ? "🤖 Bot is thinking..." : "Game in progress"}
            </p>
          ) : gameStatus.includes("check") &&
            !gameStatus.includes("checkmate") ? (
            <p className="text-sm text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded">
              ⚠️{" "}
              {gameStatus.split("-")[1] === PieceColor.WHITE ? "Dogs" : "Cats"}{" "}
              in check!
            </p>
          ) : null}

          {isBotThinking && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-blue-200 rounded-lg animate-pulse">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-blue-800">
                AI calculating...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="moves" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
          <TabsTrigger
            value="moves"
            className="data-[state=active]:bg-white data-[state=active]:text-purple-900"
          >
            📋 Moves
          </TabsTrigger>
          <TabsTrigger
            value="captured"
            className="data-[state=active]:bg-white data-[state=active]:text-purple-900"
          >
            🎯 Captured
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moves" className="mt-0">
          <Card className="rounded-t-none border-t-0">
            <CardContent className="pt-4 max-h-80 overflow-y-auto">
              {moveHistory.length > 0 ? (
                <div className="space-y-2">
                  {Array.from({
                    length: Math.ceil(moveHistory.length / 2),
                  }).map((_, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 gap-2 border-b border-gray-100 pb-2"
                    >
                      <div className="text-sm px-2 py-1 bg-gray-50 rounded">
                        <span className="text-gray-500 font-bold">
                          {i * 2 + 1}.
                        </span>{" "}
                        {moveHistory[i * 2]}
                      </div>
                      {moveHistory[i * 2 + 1] && (
                        <div className="text-sm px-2 py-1 bg-gray-50 rounded">
                          <span className="text-gray-500 font-bold">
                            {i * 2 + 2}.
                          </span>{" "}
                          {moveHistory[i * 2 + 1]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No moves yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="captured" className="mt-0">
          <Card className="rounded-t-none border-t-0">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">
                    🐕 Dogs (White) Captured by Cats:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {capturedPieces[PieceColor.BLACK].length > 0 ? (
                      capturedPieces[PieceColor.BLACK].map((piece, i) => (
                        <div key={i} className="relative w-10 h-10">
                          <img
                            src={getPieceImagePath(piece) || "/placeholder.svg"}
                            alt={`${piece.color} ${piece.type}`}
                            className="w-full h-full object-cover rounded-lg shadow-sm border border-blue-200"
                          />
                          <span className="absolute bottom-0 right-0 text-[10px] leading-none font-bold bg-black/70 text-white rounded-tl-lg px-1 py-0.5">
                            {getPieceOverlaySymbol(piece)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-blue-700">None</span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                  <h3 className="text-sm font-bold text-amber-900 mb-2">
                    😸 Cats (Black) Captured by Dogs:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {capturedPieces[PieceColor.WHITE].length > 0 ? (
                      capturedPieces[PieceColor.WHITE].map((piece, i) => (
                        <div key={i} className="relative w-10 h-10">
                          <img
                            src={getPieceImagePath(piece) || "/placeholder.svg"}
                            alt={`${piece.color} ${piece.type}`}
                            className="w-full h-full object-cover rounded-lg shadow-sm border border-amber-200"
                          />
                          <span className="absolute bottom-0 right-0 text-[10px] leading-none font-bold bg-black/70 text-white rounded-tl-lg px-1 py-0.5">
                            {getPieceOverlaySymbol(piece)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-amber-700">None</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
