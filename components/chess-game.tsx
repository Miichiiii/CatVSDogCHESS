"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ChessBoard from "./chess-board";
import GameControls from "./game-controls";
import GameInfo from "./game-info";
import GameSettingsDialog, { type GameSettings } from "./game-settings-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import {
  initialBoardState,
  PieceType,
  PieceColor,
  type ChessPiece,
  type Position,
  type EnPassantTarget,
} from "@/lib/chess-types";
import {
  isValidMove,
  makeMove,
  isCheck,
  isCheckmate,
  isStalemate,
  promotePawn,
  hasInsufficientMaterial,
  boardToString,
  checkThreefoldRepetition,
  getEnPassantTarget,
  setEnPassantTarget,
  clearEnPassantTarget,
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
  enPassantTarget: EnPassantTarget | null;
  movesSinceLastCaptureOrPawn: number;
  positionHistory: string[];
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
    gameMode: "pvbot",
    crazyMode: false,
    playerColor: "black",
    botDifficulty: "medium",
    botPersonality: "balanced",
  });
  const [botColor, setBotColor] = useState<PieceColor | null>(PieceColor.WHITE);

  // Special abilities for Crazy Mode
  const [laserPointerCount, setLaserPointerCount] = useState(3);
  const [boneCount, setBoneCount] = useState(3);
  const [isLaserPointerActive, setIsLaserPointerActive] = useState(false);
  const [isBoneActive, setIsBoneActive] = useState(false);

  // Bot thinking indicator
  const [isBotThinking, setIsBotThinking] = useState(false);
  const isBotThinkingRef = useRef(false);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botForceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Last move highlight
  const [lastMove, setLastMove] = useState<{
    from: Position;
    to: Position;
  } | null>(null);

  // Fullscreen state for board-only display
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Undo/Redo functionality
  const [gameHistory, setGameHistory] = useState<GameState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Pawn promotion state
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionPosition, setPromotionPosition] = useState<Position | null>(
    null,
  );
  const [promotionColor, setPromotionColor] = useState<PieceColor>(
    PieceColor.WHITE,
  );
  const [pendingPromotionBoard, setPendingPromotionBoard] = useState<
    (ChessPiece | null)[][] | null
  >(null);
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{
    from: Position;
    to: Position;
  } | null>(null);

  // Draw condition tracking
  const [movesSinceLastCaptureOrPawn, setMovesSinceLastCaptureOrPawn] =
    useState(0);
  const [positionHistory, setPositionHistory] = useState<string[]>([]);

  const catMoveAudioRef = useRef<HTMLAudioElement | null>(null);
  const dogMoveAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    catMoveAudioRef.current = new Audio("/pieces/movements/cat.mp3");
    dogMoveAudioRef.current = new Audio("/pieces/movements/dog.mp3");
    if (catMoveAudioRef.current) catMoveAudioRef.current.preload = "auto";
    if (dogMoveAudioRef.current) dogMoveAudioRef.current.preload = "auto";
  }, []);

  const playMoveSound = useCallback((color: PieceColor) => {
    const audio =
      color === PieceColor.BLACK
        ? catMoveAudioRef.current
        : dogMoveAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Ignore autoplay or user-gesture restrictions.
      });
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
      enPassantTarget: getEnPassantTarget(),
      movesSinceLastCaptureOrPawn,
      positionHistory: [...positionHistory],
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
    movesSinceLastCaptureOrPawn,
    positionHistory,
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
      setMovesSinceLastCaptureOrPawn(
        prevState.movesSinceLastCaptureOrPawn || 0,
      );
      setPositionHistory(prevState.positionHistory || []);
      if (prevState.enPassantTarget) {
        setEnPassantTarget(prevState.enPassantTarget);
      } else {
        clearEnPassantTarget();
      }
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
      setMovesSinceLastCaptureOrPawn(
        nextState.movesSinceLastCaptureOrPawn || 0,
      );
      setPositionHistory(nextState.positionHistory || []);
      if (nextState.enPassantTarget) {
        setEnPassantTarget(nextState.enPassantTarget);
      } else {
        clearEnPassantTarget();
      }
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
      enPassantTarget: getEnPassantTarget(),
      movesSinceLastCaptureOrPawn,
      positionHistory,
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
    movesSinceLastCaptureOrPawn,
    positionHistory,
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
        setMovesSinceLastCaptureOrPawn(
          gameData.movesSinceLastCaptureOrPawn || 0,
        );
        setPositionHistory(gameData.positionHistory || []);
        if (gameData.enPassantTarget) {
          setEnPassantTarget(gameData.enPassantTarget);
        } else {
          clearEnPassantTarget();
        }
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

  // Check for check, checkmate, stalemate, or draw after each move
  useEffect(() => {
    // Don't update game status while promotion dialog is open
    if (showPromotionDialog) return;

    if (isCheckmate(board, currentPlayer)) {
      const winner = currentPlayer === PieceColor.WHITE ? "black" : "white";
      setGameStatus(`checkmate-${winner}`);
      // Trigger confetti animation
      triggerConfetti();
    } else if (isStalemate(board, currentPlayer)) {
      setGameStatus("stalemate");
    } else if (hasInsufficientMaterial(board)) {
      setGameStatus("draw-insufficient");
    } else if (movesSinceLastCaptureOrPawn >= 100) {
      // 50-move rule: 100 half-moves = 50 full moves
      setGameStatus("draw-50moves");
    } else if (checkThreefoldRepetition(positionHistory)) {
      setGameStatus("draw-repetition");
    } else if (isCheck(board, currentPlayer)) {
      setGameStatus(`check-${currentPlayer}`);
    } else {
      setGameStatus("ongoing");
    }
  }, [
    board,
    currentPlayer,
    showPromotionDialog,
    movesSinceLastCaptureOrPawn,
    positionHistory,
  ]);

  // Bot move logic — uses refs to avoid cleanup race condition
  useEffect(() => {
    if (
      gameSettings.gameMode === "pvbot" &&
      botColor === currentPlayer &&
      !gameStatus.includes("checkmate") &&
      gameStatus !== "stalemate" &&
      !gameStatus.startsWith("draw") &&
      !isBotThinkingRef.current &&
      !showPromotionDialog
    ) {
      isBotThinkingRef.current = true;
      setIsBotThinking(true);

      // Clear any lingering timeouts
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
      if (botForceTimeoutRef.current) clearTimeout(botForceTimeoutRef.current);

      let moveCompleted = false;

      botTimeoutRef.current = setTimeout(
        () => {
          try {
            const difficulty = gameSettings.botDifficulty || "medium";
            const personality = gameSettings.botPersonality || "balanced";

            const botMove = calculateBotMove(
              board,
              botColor,
              difficulty,
              personality,
            );

            if (moveCompleted) return; // Safety timeout already triggered
            moveCompleted = true;
            if (botForceTimeoutRef.current)
              clearTimeout(botForceTimeoutRef.current);

            if (botMove) {
              const piece = board[botMove.from.row][botMove.from.col];
              const result = makeMove(board, botMove.from, botMove.to);

              // Handle bot promotion: auto-promote to queen
              let finalBoard = result.newBoard;
              if (result.isPromotion && result.promotionPosition) {
                finalBoard = promotePawn(
                  finalBoard,
                  result.promotionPosition,
                  PieceType.QUEEN,
                );
              }

              // Update captured pieces if a piece was captured
              if (result.capturedPiece) {
                setCapturedPieces((prev) => ({
                  ...prev,
                  [botColor]: [...prev[botColor], result.capturedPiece!],
                }));
              }

              // Update draw tracking
              const isPawnMove = piece?.type === PieceType.PAWN;
              if (result.capturedPiece || isPawnMove) {
                setMovesSinceLastCaptureOrPawn(0);
              } else {
                setMovesSinceLastCaptureOrPawn((prev) => prev + 1);
              }

              // Update position history
              const posString = boardToString(finalBoard);
              setPositionHistory((prev) => [...prev, posString]);

              // Add move to history
              const fromNotation = `${String.fromCharCode(97 + botMove.from.col)}${8 - botMove.from.row}`;
              const toNotation = `${String.fromCharCode(97 + botMove.to.col)}${8 - botMove.to.row}`;
              const pieceSymbol =
                piece?.type === PieceType.PAWN ? "" : piece?.type.charAt(0);

              setMoveHistory((prev) => [
                ...prev,
                `${pieceSymbol}${fromNotation}-${toNotation}`,
              ]);

              // Update board and switch player
              setBoard(finalBoard);
              setLastMove({ from: botMove.from, to: botMove.to });
              playMoveSound(botColor);
              setCurrentPlayer((prev) =>
                prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE,
              );

              // Save game state after bot move
              saveGameState();
            } else {
              // No valid moves found - switch turn to prevent freeze
              console.warn("Bot has no valid moves available");
              setCurrentPlayer((prev) =>
                prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE,
              );
            }

            isBotThinkingRef.current = false;
            setIsBotThinking(false);
          } catch (error) {
            console.error("Bot move error:", error);
            isBotThinkingRef.current = false;
            setIsBotThinking(false);
            // Switch turn on error to prevent freeze
            setCurrentPlayer((prev) =>
              prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE,
            );
          }
        },
        300, // Short delay for UI update
      );

      // Force timeout after 10 seconds - bot MUST make a move
      botForceTimeoutRef.current = setTimeout(() => {
        if (!moveCompleted) {
          moveCompleted = true;
          if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
          console.warn("Bot exceeded 10s time limit, forcing random move");

          try {
            const { getAllLegalMoves } = require("@/lib/chess-logic");
            const logicBoard = board.map((row: (ChessPiece | null)[]) =>
              row.map((piece: ChessPiece | null) => {
                if (!piece) return null;
                return {
                  type: piece.type.toLowerCase(),
                  player: piece.color === PieceColor.WHITE ? "dogs" : "cats",
                  hasMoved: piece.hasMoved,
                };
              }),
            );
            const botPlayer = botColor === PieceColor.WHITE ? "dogs" : "cats";
            const legalMoves = getAllLegalMoves(logicBoard, botPlayer);
            if (legalMoves.length > 0) {
              const randomMove =
                legalMoves[Math.floor(Math.random() * legalMoves.length)];
              const result = makeMove(board, randomMove.from, randomMove.to);

              let finalBoard = result.newBoard;
              if (result.isPromotion && result.promotionPosition) {
                finalBoard = promotePawn(
                  finalBoard,
                  result.promotionPosition,
                  PieceType.QUEEN,
                );
              }

              if (result.capturedPiece) {
                setCapturedPieces((prev) => ({
                  ...prev,
                  [botColor!]: [...prev[botColor!], result.capturedPiece!],
                }));
              }

              setBoard(finalBoard);
              setLastMove({ from: randomMove.from, to: randomMove.to });
              playMoveSound(botColor!);
              setCurrentPlayer((prev) =>
                prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE,
              );
            }
          } catch (e) {
            console.error("Force timeout fallback error:", e);
            setCurrentPlayer((prev) =>
              prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE,
            );
          }
          isBotThinkingRef.current = false;
          setIsBotThinking(false);
        }
      }, 10000);

      // NO cleanup that kills the timeout — refs handle lifecycle
    }
  }, [
    board,
    currentPlayer,
    gameSettings.gameMode,
    botColor,
    gameStatus,
    saveGameState,
    showPromotionDialog,
  ]);

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
      playMoveSound(currentPlayer);
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
      playMoveSound(currentPlayer);
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
    if (
      gameStatus.includes("checkmate") ||
      gameStatus === "stalemate" ||
      gameStatus.startsWith("draw")
    ) {
      return;
    }

    // Don't allow moves while promotion dialog is open
    if (showPromotionDialog) return;

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
        const movingPiece = board[selectedPiece.row][selectedPiece.col];
        const result = makeMove(board, selectedPiece, position);

        // Update captured pieces if a piece was captured
        if (result.capturedPiece) {
          setCapturedPieces((prev) => ({
            ...prev,
            [currentPlayer]: [...prev[currentPlayer], result.capturedPiece!],
          }));
        }

        // Update draw tracking (50-move rule)
        const isPawnMove = movingPiece?.type === PieceType.PAWN;
        if (result.capturedPiece || isPawnMove) {
          setMovesSinceLastCaptureOrPawn(0);
        } else {
          setMovesSinceLastCaptureOrPawn((prev) => prev + 1);
        }

        // Check if this is a promotion
        if (result.isPromotion && result.promotionPosition) {
          // Show promotion dialog - don't switch player yet
          setPromotionPosition(result.promotionPosition);
          setPromotionColor(currentPlayer);
          setPendingPromotionBoard(result.newBoard);
          setPendingPromotionMove({ from: selectedPiece, to: position });
          setShowPromotionDialog(true);
          setSelectedPiece(null);
          return;
        }

        // Add move to history
        const fromNotation = `${String.fromCharCode(97 + selectedPiece.col)}${8 - selectedPiece.row}`;
        const toNotation = `${String.fromCharCode(97 + position.col)}${8 - position.row}`;
        const pieceSymbol =
          movingPiece?.type === PieceType.PAWN
            ? ""
            : movingPiece?.type.charAt(0);

        setMoveHistory((prev) => [
          ...prev,
          `${pieceSymbol}${fromNotation}-${toNotation}`,
        ]);

        // Update position history for threefold repetition
        const posString = boardToString(result.newBoard);
        setPositionHistory((prev) => [...prev, posString]);

        // Update board and switch player
        setBoard(result.newBoard);
        setLastMove({ from: selectedPiece, to: position });
        playMoveSound(currentPlayer);
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

  // Handle pawn promotion selection
  const handlePromotionSelect = useCallback(
    (pieceType: PieceType) => {
      if (!promotionPosition || !pendingPromotionBoard || !pendingPromotionMove)
        return;

      const promotedBoard = promotePawn(
        pendingPromotionBoard,
        promotionPosition,
        pieceType,
      );

      // Add move to history
      const fromNotation = `${String.fromCharCode(97 + pendingPromotionMove.from.col)}${8 - pendingPromotionMove.from.row}`;
      const toNotation = `${String.fromCharCode(97 + pendingPromotionMove.to.col)}${8 - pendingPromotionMove.to.row}`;
      const promotionChar =
        pieceType === PieceType.QUEEN
          ? "Q"
          : pieceType === PieceType.ROOK
            ? "R"
            : pieceType === PieceType.BISHOP
              ? "B"
              : "N";

      setMoveHistory((prev) => [
        ...prev,
        `${fromNotation}-${toNotation}=${promotionChar}`,
      ]);

      // Update position history
      const posString = boardToString(promotedBoard);
      setPositionHistory((prev) => [...prev, posString]);

      // Update board and switch player
      setBoard(promotedBoard);
      setLastMove({
        from: pendingPromotionMove.from,
        to: pendingPromotionMove.to,
      });
      playMoveSound(promotionColor);
      setCurrentPlayer((prev) =>
        prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE,
      );

      // Clean up promotion state
      setShowPromotionDialog(false);
      setPromotionPosition(null);
      setPendingPromotionBoard(null);
      setPendingPromotionMove(null);

      // Save game state after promotion
      saveGameState();
    },
    [
      promotionPosition,
      pendingPromotionBoard,
      pendingPromotionMove,
      saveGameState,
    ],
  );

  const resetGame = () => {
    setShowSettingsDialog(true);
  };

  const startNewGame = (settings: GameSettings) => {
    setGameSettings(settings);

    // Determine bot color if playing against bot
    let nextBotColor: PieceColor | null = null;
    if (settings.gameMode === "pvbot" && settings.playerColor) {
      nextBotColor =
        settings.playerColor === "white" ? PieceColor.BLACK : PieceColor.WHITE;
      setBotColor(nextBotColor);
    } else {
      setBotColor(null);
    }

    const initialCurrentPlayer =
      settings.gameMode === "pvbot" &&
      settings.playerColor === "white" &&
      nextBotColor === PieceColor.BLACK
        ? PieceColor.BLACK
        : PieceColor.WHITE;

    // Initialize board
    const newBoard = initialBoardState();

    setBoard(newBoard);
    setCurrentPlayer(initialCurrentPlayer);
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

    // Reset draw tracking
    setMovesSinceLastCaptureOrPawn(0);
    setPositionHistory([]);
    clearEnPassantTarget();

    // Reset bot thinking state
    isBotThinkingRef.current = false;
    setIsBotThinking(false);
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    if (botForceTimeoutRef.current) clearTimeout(botForceTimeoutRef.current);

    // Reset promotion state
    setShowPromotionDialog(false);
    setPromotionPosition(null);
    setPendingPromotionBoard(null);
    setPendingPromotionMove(null);

    // Reset history
    setGameHistory([]);
    setHistoryIndex(-1);

    // Save initial game state to history
    setTimeout(() => {
      const initialState: GameState = {
        board: newBoard.map((row) => [...row]),
        currentPlayer: initialCurrentPlayer,
        capturedPieces: {
          [PieceColor.WHITE]: [],
          [PieceColor.BLACK]: [],
        },
        moveHistory: [],
        laserPointerCount: abilityCount,
        boneCount: abilityCount,
        enPassantTarget: null,
        movesSinceLastCaptureOrPawn: 0,
        positionHistory: [],
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

      {/* Pawn Promotion Dialog */}
      <Dialog open={showPromotionDialog} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-lg">
              🎉 Pawn Promotion! Choose a piece:
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4 py-4">
            {[
              {
                type: PieceType.QUEEN,
                label: "Queen",
                emoji: promotionColor === PieceColor.WHITE ? "♕" : "♛",
              },
              {
                type: PieceType.ROOK,
                label: "Rook",
                emoji: promotionColor === PieceColor.WHITE ? "♖" : "♜",
              },
              {
                type: PieceType.BISHOP,
                label: "Bishop",
                emoji: promotionColor === PieceColor.WHITE ? "♗" : "♝",
              },
              {
                type: PieceType.KNIGHT,
                label: "Knight",
                emoji: promotionColor === PieceColor.WHITE ? "♘" : "♞",
              },
            ].map(({ type, label, emoji }) => (
              <Button
                key={type}
                variant="outline"
                className="flex flex-col items-center gap-1 p-3 h-auto min-w-[70px] hover:bg-purple-100 hover:border-purple-400 transition-colors"
                onClick={() => handlePromotionSelect(type)}
              >
                <span className="text-3xl">{emoji}</span>
                <span className="text-xs font-medium">{label}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {isFullscreen ? (
        // Fullscreen board-only layout
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div
              className="border-2 border-purple-300 rounded-lg bg-white shadow-lg"
              style={{ maxHeight: "90vh", maxWidth: "90vh" }}
            >
              <ChessBoard
                board={board}
                selectedPiece={selectedPiece}
                validMoves={validMoves}
                lastMove={lastMove}
                onSquareClick={handleSquareClick}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  if (document.exitFullscreen) {
                    document.exitFullscreen();
                  }
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="h-5 w-5" />
                <span>Exit Fullscreen</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Normal layout
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
                onReset={() => setShowSettingsDialog(true)}
                gameStatus={gameStatus}
                onUndo={undoMove}
                onRedo={redoMove}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < gameHistory.length - 1}
                isFullscreen={isFullscreen}
                onFullscreenChange={setIsFullscreen}
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
      )}
    </>
  );
}
