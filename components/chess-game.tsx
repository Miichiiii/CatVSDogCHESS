"use client";

import { useState, useEffect, useCallback } from "react";
import ChessBoard from "./chess-board";
import GameControls from "./game-controls";
import GameInfo from "./game-info";
import GameSettingsDialog, { type GameSettings } from "./game-settings-dialog";
import {
  initialBoardState,
  PieceType,
  PieceColor,
  type ChessPiece,
  type Position,
} from "@/lib/chess-types";
import {
  isValidMove,
  makeMove,
  isCheck,
  isCheckmate,
  isStalemate,
} from "@/lib/chess-rules";
import { calculateBotMove } from "@/lib/chess-bot";
import SpecialAbilities from "./special-abilities";
import { findClosestPiece, isValidPosition } from "@/lib/special-abilities";
import confetti from "canvas-confetti";

// Type for game state history (for undo/redo)
interface GameState {
  board: (ChessPiece | null)[][];
  currentPlayer: PieceColor;
  capturedPieces: {
    [PieceColor.WHITE]: ChessPiece[];
    [PieceColor.BLACK]: ChessPiece[];
  };
  moveHistory: string[];
  laserPointerCount: number;
  boneCount: number;
}

export default function ChessGame() {
  const [board, setBoard] =
    useState<(ChessPiece | null)[][]>(initialBoardState());
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>(
    PieceColor.WHITE,
  );
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [gameStatus, setGameStatus] = useState<string>("ongoing");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{
    [PieceColor.WHITE]: ChessPiece[];
    [PieceColor.BLACK]: ChessPiece[];
  }>({
    [PieceColor.WHITE]: [],
    [PieceColor.BLACK]: [],
  });

  // Game settings
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    gameMode: "pvp",
    crazyMode: false,
  });
  const [botColor, setBotColor] = useState<PieceColor | null>(null);

  // Special abilities for Crazy Mode
  const [laserPointerCount, setLaserPointerCount] = useState(3);
  const [boneCount, setBoneCount] = useState(3);
  const [isLaserPointerActive, setIsLaserPointerActive] = useState(false);
  const [isBoneActive, setIsBoneActive] = useState(false);

  // Bot thinking indicator
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Last move highlight
  const [lastMove, setLastMove] = useState<{
    from: Position;
    to: Position;
  } | null>(null);

  // Undo/Redo functionality
  const [gameHistory, setGameHistory] = useState<GameState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save current game state to history
  const saveGameState = useCallback(() => {
    const state: GameState = {
      board: board.map((row) => [...row]),
      currentPlayer,
      capturedPieces: {
        [PieceColor.WHITE]: [...capturedPieces[PieceColor.WHITE]],
        [PieceColor.BLACK]: [...capturedPieces[PieceColor.BLACK]],
      },
      moveHistory: [...moveHistory],
      laserPointerCount,
      boneCount,
    };

    // Remove any future states if we're not at the end
    const newHistory = gameHistory.slice(0, historyIndex + 1);
    newHistory.push(state);
    setGameHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [
    board,
    currentPlayer,
    capturedPieces,
    moveHistory,
    laserPointerCount,
    boneCount,
    gameHistory,
    historyIndex,
  ]);

  // Undo last move
  const undoMove = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = gameHistory[historyIndex - 1];
      setBoard(prevState.board.map((row) => [...row]));
      setCurrentPlayer(prevState.currentPlayer);
      setCapturedPieces(prevState.capturedPieces);
      setMoveHistory(prevState.moveHistory);
      setLaserPointerCount(prevState.laserPointerCount);
      setBoneCount(prevState.boneCount);
      setHistoryIndex(historyIndex - 1);
      setSelectedPiece(null);
    }
  }, [historyIndex, gameHistory]);

  // Redo move
  const redoMove = useCallback(() => {
    if (historyIndex < gameHistory.length - 1) {
      const nextState = gameHistory[historyIndex + 1];
      setBoard(nextState.board.map((row) => [...row]));
      setCurrentPlayer(nextState.currentPlayer);
      setCapturedPieces(nextState.capturedPieces);
      setMoveHistory(nextState.moveHistory);
      setLaserPointerCount(nextState.laserPointerCount);
      setBoneCount(nextState.boneCount);
      setHistoryIndex(historyIndex + 1);
      setSelectedPiece(null);
    }
  }, [historyIndex, gameHistory]);

  // Confetti animation for checkmate
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  // Save/Load game to localStorage
  const saveGameToStorage = useCallback(() => {
    const gameData = {
      board,
      currentPlayer,
      capturedPieces,
      moveHistory,
      gameStatus,
      gameSettings,
      laserPointerCount,
      boneCount,
      gameHistory,
      historyIndex,
    };
    localStorage.setItem("catsdogs-chess-save", JSON.stringify(gameData));
  }, [
    board,
    currentPlayer,
    capturedPieces,
    moveHistory,
    gameStatus,
    gameSettings,
    laserPointerCount,
    boneCount,
    gameHistory,
    historyIndex,
  ]);

  const loadGameFromStorage = useCallback(() => {
    const saved = localStorage.getItem("catsdogs-chess-save");
    if (saved) {
      try {
        const gameData = JSON.parse(saved);
        setBoard(gameData.board);
        setCurrentPlayer(gameData.currentPlayer);
        setCapturedPieces(gameData.capturedPieces);
        setMoveHistory(gameData.moveHistory);
        setGameStatus(gameData.gameStatus);
        setGameSettings(gameData.gameSettings);
        setLaserPointerCount(gameData.laserPointerCount);
        setBoneCount(gameData.boneCount);
        setGameHistory(gameData.gameHistory || []);
        setHistoryIndex(gameData.historyIndex || -1);
        return true;
      } catch (e) {
        console.error("Failed to load game:", e);
        return false;
      }
    }
    return false;
  }, []);

  // Auto-save game state periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (gameStatus === "ongoing" || gameStatus.includes("check")) {
        saveGameToStorage();
      }
    }, 10000); // Save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [saveGameToStorage, gameStatus]);

  // Calculate valid moves when a piece is selected
  useEffect(() => {
    if (selectedPiece) {
      const moves: Position[] = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (isValidMove(board, selectedPiece, { row, col }, currentPlayer)) {
            moves.push({ row, col });
          }
        }
      }
      setValidMoves(moves);
    } else {
      setValidMoves([]);
    }
  }, [selectedPiece, board, currentPlayer]);

  // Check for check, checkmate, or stalemate after each move
  useEffect(() => {
    if (isCheckmate(board, currentPlayer)) {
      const winner = currentPlayer === PieceColor.WHITE ? "black" : "white";
      setGameStatus(`checkmate-${winner}`);
      // Trigger confetti animation
      triggerConfetti();
    } else if (isStalemate(board, currentPlayer)) {
      setGameStatus("stalemate");
    } else if (isCheck(board, currentPlayer)) {
      setGameStatus(`check-${currentPlayer}`);
    } else {
      setGameStatus("ongoing");
    }
  }, [board, currentPlayer]);

  // Bot move logic
  useEffect(() => {
    if (
      gameSettings.gameMode === "pvbot" &&
      botColor === currentPlayer &&
      !gameStatus.includes("checkmate") &&
      gameStatus !== "stalemate" &&
      !isBotThinking
    ) {
      setIsBotThinking(true);

      // Add a small delay for better UX
      const timeout = setTimeout(
        () => {
          const difficulty = gameSettings.botDifficulty || "medium";
          const personality = gameSettings.botPersonality || "balanced";
          const botMove = calculateBotMove(
            board,
            botColor,
            difficulty,
            personality,
          );

          if (botMove) {
            const result = makeMove(board, botMove.from, botMove.to);

            // Update captured pieces if a piece was captured
            if (result.capturedPiece) {
              setCapturedPieces((prev) => {
                return {
                  ...prev,
                  [botColor]: [...prev[botColor], result.capturedPiece],
                };
              });
            }

            // Add move to history
            const fromNotation = `${String.fromCharCode(97 + botMove.from.col)}${8 - botMove.from.row}`;
            const toNotation = `${String.fromCharCode(97 + botMove.to.col)}${8 - botMove.to.row}`;
            const piece = board[botMove.from.row][botMove.from.col];
            const pieceSymbol =
              piece?.type === PieceType.PAWN ? "" : piece?.type.charAt(0);

            setMoveHistory((prev) => [
              ...prev,
              `${pieceSymbol}${fromNotation}-${toNotation}`,
            ]);

            // Update board and switch player
            setBoard(result.newBoard);
            setLastMove({ from: botMove.from, to: botMove.to });
            setCurrentPlayer((prev) =>
              prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE,
            );

            // Save game state after bot move
            saveGameState();
          }

          setIsBotThinking(false);
        },
        Math.min(800, 3000),
      ); // Max 3 seconds thinking time

      return () => {
        clearTimeout(timeout);
        setIsBotThinking(false);
      };
    }
  }, [board, currentPlayer, gameSettings.gameMode, botColor, gameStatus]);

  // Special Abilities Handlers
  const handleUseLaserPointer = () => {
    if (laserPointerCount > 0 && currentPlayer === PieceColor.WHITE) {
      setIsLaserPointerActive(true);
      setSelectedPiece(null); // Deselect any selected piece
    }
  };

  const handleUseBone = () => {
    if (boneCount > 0 && currentPlayer === PieceColor.BLACK) {
      setIsBoneActive(true);
      setSelectedPiece(null); // Deselect any selected piece
    }
  };

  const handleLaserPointerPlacement = (targetPosition: Position) => {
    if (!isValidPosition(targetPosition)) return;

    // Find closest black piece (cat) - White uses Laser Pointer against black cats
    const closestPiece = findClosestPiece(
      board,
      targetPosition,
      PieceColor.BLACK,
    );

    if (closestPiece) {
      // Move the piece to the target position
      const newBoard = board.map((row) => [...row]);
      const piece = newBoard[closestPiece.row][closestPiece.col];

      // Capture piece if target is occupied
      const capturedPiece = newBoard[targetPosition.row][targetPosition.col];
      if (capturedPiece) {
        setCapturedPieces((prev) => ({
          ...prev,
          [PieceColor.WHITE]: [...prev[PieceColor.WHITE], capturedPiece],
        }));
      }

      newBoard[targetPosition.row][targetPosition.col] = piece;
      newBoard[closestPiece.row][closestPiece.col] = null;

      setBoard(newBoard);
      setLaserPointerCount((prev) => prev - 1);
      setMoveHistory((prev) => [
        ...prev,
        `🔦Laser: ${String.fromCharCode(97 + targetPosition.col)}${8 - targetPosition.row}`,
      ]);

      // Special ability counts as a turn - switch player
      setCurrentPlayer((prev) =>
        prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE,
      );
    }

    setIsLaserPointerActive(false);
  };

  const handleBonePlacement = (targetPosition: Position) => {
    if (!isValidPosition(targetPosition)) return;

    // Find closest white piece (dog) - Black uses Bone against white dogs
    const closestPiece = findClosestPiece(
      board,
      targetPosition,
      PieceColor.WHITE,
    );

    if (closestPiece) {
      // Move the piece to the target position
      const newBoard = board.map((row) => [...row]);
      const piece = newBoard[closestPiece.row][closestPiece.col];

      // Capture piece if target is occupied
      const capturedPiece = newBoard[targetPosition.row][targetPosition.col];
      if (capturedPiece) {
        setCapturedPieces((prev) => ({
          ...prev,
          [PieceColor.BLACK]: [...prev[PieceColor.BLACK], capturedPiece],
        }));
      }

      newBoard[targetPosition.row][targetPosition.col] = piece;
      newBoard[closestPiece.row][closestPiece.col] = null;

      setBoard(newBoard);
      setBoneCount((prev) => prev - 1);
      setMoveHistory((prev) => [
        ...prev,
        `🦴Bone: ${String.fromCharCode(97 + targetPosition.col)}${8 - targetPosition.row}`,
      ]);

      // Special ability counts as a turn - switch player
      setCurrentPlayer((prev) =>
        prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE,
      );
    }

    setIsBoneActive(false);
  };

  const handleSquareClick = (position: Position) => {
    // If game is over, don't allow further moves
    if (gameStatus.includes("checkmate") || gameStatus === "stalemate") {
      return;
    }

    // Handle special abilities in Crazy Mode
    if (gameSettings.crazyMode) {
      if (isLaserPointerActive) {
        handleLaserPointerPlacement(position);
        return;
      }
      if (isBoneActive) {
        handleBonePlacement(position);
        return;
      }
    }

    // If playing against bot and it's the bot's turn, don't allow moves
    if (gameSettings.gameMode === "pvbot" && currentPlayer === botColor) {
      return;
    }

    const piece = board[position.row][position.col];

    // If a piece is already selected
    if (selectedPiece) {
      // If clicking on the same piece, deselect it
      if (
        selectedPiece.row === position.row &&
        selectedPiece.col === position.col
      ) {
        setSelectedPiece(null);
        return;
      }

      // If clicking on a valid move position
      if (
        validMoves.some(
          (move) => move.row === position.row && move.col === position.col,
        )
      ) {
        const result = makeMove(board, selectedPiece, position);

        // Update captured pieces if a piece was captured
        if (result.capturedPiece) {
          setCapturedPieces((prev) => {
            const oppositeColor =
              currentPlayer === PieceColor.WHITE
                ? PieceColor.BLACK
                : PieceColor.WHITE;
            return {
              ...prev,
              [currentPlayer]: [...prev[currentPlayer], result.capturedPiece],
            };
          });
        }

        // Add move to history
        const fromNotation = `${String.fromCharCode(97 + selectedPiece.col)}${8 - selectedPiece.row}`;
        const toNotation = `${String.fromCharCode(97 + position.col)}${8 - position.row}`;
        const pieceSymbol =
          board[selectedPiece.row][selectedPiece.col]?.type === PieceType.PAWN
            ? ""
            : board[selectedPiece.row][selectedPiece.col]?.type.charAt(0);

        setMoveHistory((prev) => [
          ...prev,
          `${pieceSymbol}${fromNotation}-${toNotation}`,
        ]);

        // Update board and switch player
        setBoard(result.newBoard);
        setLastMove({ from: selectedPiece, to: position });
        setCurrentPlayer((prev) =>
          prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE,
        );
        setSelectedPiece(null);

        // Save game state after player move
        saveGameState();
      }
      // If clicking on another piece of the same color, select that piece instead
      else if (piece && piece.color === currentPlayer) {
        setSelectedPiece(position);
      }
    }
    // If no piece is selected and clicking on a piece of the current player's color
    else if (piece && piece.color === currentPlayer) {
      setSelectedPiece(position);
    }
  };

  const resetGame = () => {
    setShowSettingsDialog(true);
  };

  const startNewGame = (settings: GameSettings) => {
    setGameSettings(settings);

    // Determine bot color if playing against bot
    if (settings.gameMode === "pvbot" && settings.playerColor) {
      setBotColor(
        settings.playerColor === "white" ? PieceColor.BLACK : PieceColor.WHITE,
      );
    } else {
      setBotColor(null);
    }

    // Initialize board
    const newBoard = initialBoardState();

    setBoard(newBoard);
    setCurrentPlayer(PieceColor.WHITE);
    setSelectedPiece(null);
    setValidMoves([]);
    setGameStatus("ongoing");
    setMoveHistory([]);
    setCapturedPieces({
      [PieceColor.WHITE]: [],
      [PieceColor.BLACK]: [],
    });

    // Reset special abilities
    const abilityCount = settings.specialAbilityCount || 3;
    setLaserPointerCount(abilityCount);
    setBoneCount(abilityCount);
    setIsLaserPointerActive(false);
    setIsBoneActive(false);

    // Reset history
    setGameHistory([]);
    setHistoryIndex(-1);

    // Save initial game state to history
    setTimeout(() => {
      const initialState: GameState = {
        board: newBoard.map((row) => [...row]),
        currentPlayer: PieceColor.WHITE,
        capturedPieces: {
          [PieceColor.WHITE]: [],
          [PieceColor.BLACK]: [],
        },
        moveHistory: [],
        laserPointerCount: abilityCount,
        boneCount: abilityCount,
      };
      setGameHistory([initialState]);
      setHistoryIndex(0);
    }, 100);
  };

  // Create a crazy mode board with shuffled back ranks

  return (
    <>
      <GameSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        onStartGame={startNewGame}
        onLoadGame={loadGameFromStorage}
      />

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full max-w-7xl">
        <div className="flex-1 flex flex-col items-center justify-center min-w-0">
          <div className="w-full max-w-sm sm:max-w-md border-2 border-purple-300 rounded-lg bg-white shadow-lg">
            <ChessBoard
              board={board}
              selectedPiece={selectedPiece}
              validMoves={validMoves}
              lastMove={lastMove}
              onSquareClick={handleSquareClick}
            />
          </div>
          <div className="w-full mt-4">
            <GameControls
              onReset={resetGame}
              gameStatus={gameStatus}
              onUndo={undoMove}
              onRedo={redoMove}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < gameHistory.length - 1}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-4 px-2 sm:px-4">
          <GameInfo
            currentPlayer={currentPlayer}
            gameStatus={gameStatus}
            moveHistory={moveHistory}
            capturedPieces={capturedPieces}
            isBotThinking={isBotThinking}
          />
          <SpecialAbilities
            currentPlayer={currentPlayer}
            laserPointerCount={laserPointerCount}
            boneCount={boneCount}
            onUseLaserPointer={handleUseLaserPointer}
            onUseBone={handleUseBone}
            isLaserPointerActive={isLaserPointerActive}
            isBoneActive={isBoneActive}
            crazyMode={gameSettings.crazyMode}
          />
        </div>
      </div>
    </>
  );
}
