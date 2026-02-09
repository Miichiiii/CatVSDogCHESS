"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Info, FolderOpen } from "lucide-react";

export interface GameSettings {
  gameMode: "pvp" | "pvbot";
  crazyMode: boolean;
  playerColor?: "white" | "black";
  specialAbilityCount?: number;
  botDifficulty?: "easy" | "medium" | "hard";
  botPersonality?: "balanced" | "aggressive" | "defensive";
}

function CrazyModeInfoButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-purple-200"
        >
          <Info className="h-4 w-4 text-purple-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🎭 What is Crazy Mode?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-purple-900">🎲 Random Setup</h4>
            <p className="text-sm text-gray-700">
              Back row pieces are randomly shuffled for unpredictable opening
              strategies!
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-blue-900">🔦 Special Abilities</h4>
            <p className="text-sm text-gray-700">
              Dogs (White) can use Laser Pointers to lure cats around the board.
              Cats (Black) can place Bones to lure dogs! You can choose 1-3 uses
              per game.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-amber-900">⚡ Strategic Depth</h4>
            <p className="text-sm text-gray-700">
              Use abilities wisely to trap opponents or escape dangerous
              positions. Using an ability counts as your turn!
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              💡 Tip: Save abilities for critical moments in the game!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface GameSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartGame: (settings: GameSettings) => void;
  onLoadGame?: () => void;
}

export default function GameSettingsDialog({
  open,
  onOpenChange,
  onStartGame,
  onLoadGame,
}: GameSettingsDialogProps) {
  const [gameMode, setGameMode] = useState<"pvp" | "pvbot">("pvp");
  const [crazyMode, setCrazyMode] = useState(false);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [specialAbilityCount, setSpecialAbilityCount] = useState<number>(3);
  const [botDifficulty, setBotDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("medium");
  const [botPersonality, setBotPersonality] = useState<
    "balanced" | "aggressive" | "defensive"
  >("balanced");
  const [hasSavedGame, setHasSavedGame] = useState(false);

  // Check for saved game when dialog opens
  React.useEffect(() => {
    if (open) {
      const savedGame = localStorage.getItem("catdogchess_saved_game");
      setHasSavedGame(!!savedGame);
    }
  }, [open]);

  const handleStartGame = () => {
    onStartGame({
      gameMode,
      crazyMode,
      playerColor: gameMode === "pvbot" ? playerColor : undefined,
      specialAbilityCount: crazyMode ? specialAbilityCount : undefined,
      botDifficulty: gameMode === "pvbot" ? botDifficulty : undefined,
      botPersonality: gameMode === "pvbot" ? botPersonality : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-h-[95vh] overflow-y-auto sm:max-w-lg p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ♟️ New Chess Game
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose your game settings and start playing!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Game Mode Selection */}
          <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <Label className="text-base md:text-lg font-bold text-blue-900">
              👥 Game Mode
            </Label>
            <RadioGroup
              value={gameMode}
              onValueChange={(value) => setGameMode(value as "pvp" | "pvbot")}
            >
              <div className="flex items-center space-x-2 p-2 hover:bg-blue-200 rounded transition">
                <RadioGroupItem value="pvp" id="pvp" />
                <Label
                  htmlFor="pvp"
                  className="font-normal cursor-pointer text-blue-900"
                >
                  👥 Player vs Player
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 hover:bg-blue-200 rounded transition">
                <RadioGroupItem value="pvbot" id="pvbot" />
                <Label
                  htmlFor="pvbot"
                  className="font-normal cursor-pointer text-blue-900"
                >
                  🤖 Player vs Bot
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Player Color Selection (only for PvBot) */}
          {gameMode === "pvbot" && (
            <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 animate-in fade-in">
              <Label className="text-base md:text-lg font-bold text-amber-900">
                🎯 Choose Your Side
              </Label>
              <RadioGroup
                value={playerColor}
                onValueChange={(value) =>
                  setPlayerColor(value as "white" | "black")
                }
              >
                <div className="flex items-center space-x-2 p-2 hover:bg-amber-200 rounded transition">
                  <RadioGroupItem value="white" id="white" />
                  <Label
                    htmlFor="white"
                    className="font-normal cursor-pointer text-amber-900"
                  >
                    🐕 Dogs (White) - You start first
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 hover:bg-amber-200 rounded transition">
                  <RadioGroupItem value="black" id="black" />
                  <Label
                    htmlFor="black"
                    className="font-normal cursor-pointer text-amber-900"
                  >
                    😸 Cats (Black) - AI starts first
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Bot Difficulty and Personality (only for PvBot) */}
          {gameMode === "pvbot" && (
            <>
              <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200 animate-in fade-in">
                <Label className="text-base md:text-lg font-bold text-green-900">
                  🎮 Bot Difficulty
                </Label>
                <RadioGroup
                  value={botDifficulty}
                  onValueChange={(value) =>
                    setBotDifficulty(value as "easy" | "medium" | "hard")
                  }
                >
                  <div className="flex items-center space-x-2 p-2 hover:bg-green-200 rounded transition">
                    <RadioGroupItem value="easy" id="diff-easy" />
                    <Label
                      htmlFor="diff-easy"
                      className="font-normal cursor-pointer text-green-900"
                    >
                      😊 Easy - Good for beginners
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-green-200 rounded transition">
                    <RadioGroupItem value="medium" id="diff-medium" />
                    <Label
                      htmlFor="diff-medium"
                      className="font-normal cursor-pointer text-green-900"
                    >
                      🤔 Medium - Balanced challenge
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-green-200 rounded transition">
                    <RadioGroupItem value="hard" id="diff-hard" />
                    <Label
                      htmlFor="diff-hard"
                      className="font-normal cursor-pointer text-green-900"
                    >
                      😈 Hard - Expert strategist
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 animate-in fade-in">
                <Label className="text-base md:text-lg font-bold text-cyan-900">
                  🎯 Bot Personality
                </Label>
                <RadioGroup
                  value={botPersonality}
                  onValueChange={(value) =>
                    setBotPersonality(value as "balanced" | "aggressive" | "defensive")
                  }
                >
                  <div className="flex items-center space-x-2 p-2 hover:bg-cyan-200 rounded transition">
                    <RadioGroupItem value="balanced" id="pers-balanced" />
                    <Label
                      htmlFor="pers-balanced"
                      className="font-normal cursor-pointer text-cyan-900"
                    >
                      ⚖️ Balanced - Mix of attack & defense
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-cyan-200 rounded transition">
                    <RadioGroupItem value="aggressive" id="pers-aggressive" />
                    <Label
                      htmlFor="pers-aggressive"
                      className="font-normal cursor-pointer text-cyan-900"
                    >
                      ⚔️ Aggressive - Always on the attack
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-cyan-200 rounded transition">
                    <RadioGroupItem value="defensive" id="pers-defensive" />
                    <Label
                      htmlFor="pers-defensive"
                      className="font-normal cursor-pointer text-cyan-900"
                    >
                      🛡️ Defensive - Protect pieces carefully
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Crazy Mode Toggle */}
          <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="crazy-mode"
                    className="text-base md:text-lg font-bold text-purple-900 cursor-pointer"
                  >
                    🎭 Crazy Mode
                  </Label>
                  <CrazyModeInfoButton />
                </div>
                <p className="text-sm text-purple-700">
                  Random setup + special abilities
                </p>
              </div>
              <Switch
                id="crazy-mode"
                checked={crazyMode}
                onCheckedChange={setCrazyMode}
              />
            </div>
          </div>

          {/* Special Ability Count (only visible when Crazy Mode is enabled) */}
          {crazyMode && (
            <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 animate-in fade-in">
              <Label className="text-base md:text-lg font-bold text-pink-900">
                ⚡ Special Abilities per Player
              </Label>
              <RadioGroup
                value={specialAbilityCount.toString()}
                onValueChange={(value) =>
                  setSpecialAbilityCount(parseInt(value))
                }
              >
                <div className="flex items-center space-x-2 p-2 hover:bg-pink-200 rounded transition">
                  <RadioGroupItem value="1" id="ability-1" />
                  <Label
                    htmlFor="ability-1"
                    className="font-normal cursor-pointer text-pink-900"
                  >
                    1x Special Ability
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 hover:bg-pink-200 rounded transition">
                  <RadioGroupItem value="2" id="ability-2" />
                  <Label
                    htmlFor="ability-2"
                    className="font-normal cursor-pointer text-pink-900"
                  >
                    2x Special Abilities
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 hover:bg-pink-200 rounded transition">
                  <RadioGroupItem value="3" id="ability-3" />
                  <Label
                    htmlFor="ability-3"
                    className="font-normal cursor-pointer text-pink-900"
                  >
                    3x Special Abilities (Default)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          {hasSavedGame && onLoadGame && (
            <Button
              variant="secondary"
              onClick={() => {
                onLoadGame();
                onOpenChange(false);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Load Saved Game
            </Button>
          )}
          <Button
            onClick={handleStartGame}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            Start Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
