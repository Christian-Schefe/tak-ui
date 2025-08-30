import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ui,
  type Coord,
  type GameSettings,
  type GameState,
  type Move,
  type PieceVariant,
} from '../packages/tak-core';
import { newGame, setTimeRemaining } from '../packages/tak-core/game';
import { moveFromString } from '../packages/tak-core/move';
import {
  dirFromAligned,
  dirToString,
  offsetCoord,
} from '../packages/tak-core/coord';
import { Board3D } from './board3d/Board3D';
import { useImmer } from 'use-immer';
import { useAuth, useWSAPI } from '../authHooks';
import { useSettings } from '../settings';
import { Board2D } from './board2d/Board2D';
import { GameOverDialog } from './dialogs/GameOverDialog';
import { notifications } from '@mantine/notifications';
import { useGameData } from '../gameDataHooks';
import { ReadyState } from 'react-use-websocket';
import type { BoardMode } from './board';
import { BoardNinja } from './boardNinja/BoardNinja';
import { useRatings } from '../api/ratings';
import type { GameListEntry } from '../features/gameList';

const placeRegex = /Game#\d+ P ([A-Z])([1-9])(?: ([CW]))?/;
const parsePlaceMove = (placeMatch: RegExpMatchArray): Move => {
  const [, col, row] = placeMatch;
  const variant = placeMatch[3] ? (placeMatch[3] === 'C' ? 'C' : 'S') : '';
  return moveFromString(`${variant}${col.toLowerCase()}${row}`);
};

const moveRegex = /Game#\d+ M ([A-Z])([1-9]) ([A-Z])([1-9])((?: [1-9])*)/;
const parseMoveMove = (moveMatch: RegExpMatchArray): Move => {
  const [, fromCol, fromRow, toCol, toRow, drops] = moveMatch;
  const dropNums = drops
    .split(' ')
    .filter((n) => n !== '')
    .map((d) => d.charCodeAt(0) - '0'.charCodeAt(0));
  const fromX = fromCol.charCodeAt(0) - 'A'.charCodeAt(0);
  const fromY = fromRow.charCodeAt(0) - '1'.charCodeAt(0);
  const toX = toCol.charCodeAt(0) - 'A'.charCodeAt(0);
  const toY = toRow.charCodeAt(0) - '1'.charCodeAt(0);
  const dir = dirFromAligned({ x: toX, y: toY }, { x: fromX, y: fromY });
  if (!dir) {
    console.error('invalid move received: from', { fromX, fromY }, 'to', {
      toX,
      toY,
    });
    throw new Error('invalid move received');
  }
  return moveFromString(
    `${dropNums.reduce((acc, n) => acc + n, 0).toString()}${fromCol.toLowerCase()}${fromRow}${dirToString(dir)}${dropNums.join('')}`,
  );
};

export function PlayedGame({
  observed,
  gameEntry,
}: {
  observed: boolean;
  gameEntry: GameListEntry;
}) {
  const settings = useMemo(() => {
    const settings: GameSettings = {
      boardSize: gameEntry.boardSize,
      halfKomi: gameEntry.halfKomi,
      reserve: {
        pieces: gameEntry.pieces,
        capstones: gameEntry.capstones,
      },
      clock: {
        contingentMs: gameEntry.timeContingentSeconds * 1000,
        incrementMs: gameEntry.timeIncrementSeconds * 1000,
        extra: gameEntry.triggerMove
          ? {
              move: gameEntry.triggerMove.move,
              amountMs: gameEntry.triggerMove.amountSeconds * 1000,
            }
          : undefined,
      },
    };
    return settings;
  }, [gameEntry]);

  const gameId = useMemo(() => gameEntry.id.toString(), [gameEntry.id]);
  const { user } = useAuth();

  const ratings = useRatings([gameEntry.white, gameEntry.black]);

  const playerInfo = {
    white: {
      username: gameEntry.white,
      rating: ratings[gameEntry.white]?.rating ?? 1000,
    },
    black: {
      username: gameEntry.black,
      rating: ratings[gameEntry.black]?.rating ?? 1000,
    },
  };

  const boardMode: BoardMode = useMemo(() => {
    if (observed) return { type: 'spectator', gameId };
    if (user?.username === gameEntry.white)
      return { type: 'remote', localPlayer: 'white', gameId };
    if (user?.username === gameEntry.black)
      return { type: 'remote', localPlayer: 'black', gameId };
    return { type: 'spectator', gameId };
  }, [observed, user?.username, gameEntry.white, gameEntry.black, gameId]);

  const { sendMessage, readyState } = useWSAPI();

  const gameData = useGameData();

  const { devMode } = useSettings();
  const showNotifications = useRef(devMode.value);
  useEffect(() => {
    showNotifications.current = devMode.value;
  }, [devMode.value]);

  useEffect(() => {
    if (observed && readyState === ReadyState.OPEN) {
      console.log('Subscribing to game:', gameId);
      sendMessage(`Observe ${gameId}`);
      if (showNotifications.current) {
        notifications.show({
          title: 'Subscribing to game',
          message: `Subscribing to game: ${gameId}`,
          position: 'top-right',
        });
      }

      return () => {
        console.log('Unsubscribing from game:', gameId);
        sendMessage(`Unobserve ${gameId}`, false);
        if (showNotifications.current) {
          notifications.show({
            title: 'Unsubscribing from game',
            message: `Unsubscribing from game: ${gameId}`,
            position: 'top-right',
          });
        }
      };
    }
  }, [observed, readyState, gameId, sendMessage]);

  useEffect(() => {
    if (observed && readyState === ReadyState.OPEN) {
      const roomId = [gameEntry.white, gameEntry.black].sort().join('-');
      sendMessage(`JoinRoom ${roomId}`);

      return () => {
        sendMessage(`LeaveRoom ${roomId}`, false);
      };
    }
  }, [observed, gameEntry.white, gameEntry.black, readyState, sendMessage]);

  const [game, setGame] = useImmer<ui.GameUI>(() => {
    console.log('Creating new game with settings:', settings);
    return ui.newGameUI(newGame(settings));
  });

  const resetGameCallback = useCallback(() => {
    setGame(() => {
      console.log('Resetting game to new game with settings:', settings);
      return ui.newGameUI(newGame(settings));
    });
    setReadMessageIndex((prev) => {
      const { [gameId]: _, ...rest } = prev;
      return rest;
    });
  }, [settings, gameId, setGame]);

  const resetGame = useRef(resetGameCallback);
  useEffect(() => {
    resetGame.current = resetGameCallback;
  }, [resetGameCallback]);

  const [readMessageIndices, setReadMessageIndex] = useState<
    Record<string, number | undefined>
  >({});

  useEffect(() => {
    resetGame.current();
    console.log('Game Id changed to', gameId);
    if (showNotifications.current) {
      notifications.show({
        title: 'Game Id Changed',
        message: `Game ID changed to: ${gameId}`,
        position: 'top-right',
      });
    }
  }, [gameId]);

  const gameInfo = gameData.gameInfo[gameId] ?? {
    drawOffer: false,
    gameOver: false,
    messages: [],
    moveMessages: [],
    timeMessages: [],
    undoOffer: false,
  };
  const moveMessages = gameInfo.moveMessages;
  const timeMessages = gameInfo.timeMessages;

  useEffect(() => {
    const readMessageIndex = readMessageIndices[gameId] ?? 0;
    const toRead = Math.max(0, moveMessages.length - readMessageIndex);
    if (toRead <= 0) return;

    console.log(moveMessages.length, readMessageIndex, toRead);

    const moves: (
      | { type: 'move'; move: Move }
      | { type: 'undo' }
      | { type: 'gameOver'; state: GameState }
    )[] = [];

    for (let i = 0; i < toRead; i++) {
      const message = moveMessages[readMessageIndex + i];
      if (typeof message === 'string') {
        console.log(moveMessages.length, readMessageIndex + i, message);

        const placeMatch = placeRegex.exec(message);
        const moveMatch = moveRegex.exec(message);

        if (placeMatch) {
          moves.push({ type: 'move', move: parsePlaceMove(placeMatch) });
        } else if (moveMatch) {
          moves.push({ type: 'move', move: parseMoveMove(moveMatch) });
        } else if (message === 'undo') {
          moves.push({ type: 'undo' });
        } else {
          console.error('Failed to parse move message:', message);
        }
      } else {
        moves.push({ type: 'gameOver', state: message });
      }
    }
    setReadMessageIndex((prev) => ({
      ...prev,
      [gameId]: (prev[gameId] ?? 0) + toRead,
    }));
    setGame((draft) => {
      try {
        for (const move of moves) {
          if (move.type === 'move') {
            ui.doMove(draft, move.move);
          } else if (move.type === 'undo') {
            ui.undoMove(draft);
          } else {
            if (game.actualGame.gameState.type !== move.state.type) {
              console.log('received game over:', move.state);
              setGame((draft) => {
                draft.actualGame.gameState = move.state;
                ui.onGameUpdate(draft);
              });
            }
          }
        }
      } catch (err) {
        console.error('desync: ', err);
      }
    });
  }, [
    gameId,
    setGame,
    moveMessages,
    readMessageIndices,
    game.actualGame.currentPlayer,
    game.actualGame.gameState.type,
  ]);

  const sendMoveMessage = useCallback(
    (move: Move) => {
      if (move.type === 'place') {
        const col = String.fromCharCode(move.pos.x + 'A'.charCodeAt(0));
        const row = move.pos.y + 1;
        const variant =
          move.variant === 'capstone'
            ? ' C'
            : move.variant === 'standing'
              ? ' W'
              : '';
        sendMessage(`Game#${gameId} P ${col}${row.toString()}${variant}`);
      } else {
        const fromCol = String.fromCharCode(move.from.x + 'A'.charCodeAt(0));
        const fromRow = move.from.y + 1;
        const to = offsetCoord(move.from, move.dir, move.drops.length);
        const toCol = String.fromCharCode(to.x + 'A'.charCodeAt(0));
        const toRow = to.y + 1;
        const drops = move.drops.join(' ');
        sendMessage(
          `Game#${gameId} M ${fromCol}${fromRow.toString()} ${toCol}${toRow.toString()} ${drops}`,
        );
      }
    },
    [gameId, sendMessage],
  );

  const lastTimeMessage =
    timeMessages.length > 0 ? timeMessages[timeMessages.length - 1] : null;
  useEffect(() => {
    setGame((draft) => {
      if (!lastTimeMessage) return;
      setTimeRemaining(
        draft.actualGame,
        lastTimeMessage,
        lastTimeMessage.timestamp,
      );
    });
  }, [setGame, lastTimeMessage]);

  const { boardType } = useSettings();

  const gameCallbacks = useMemo(() => {
    const onClickTile = (pos: Coord, variant: PieceVariant) => {
      if (observed) return;
      if (
        boardMode.type !== 'remote' ||
        game.actualGame.currentPlayer !== boardMode.localPlayer
      ) {
        throw new Error('not your turn');
      }
      setGame((draft) => {
        const move = ui.tryPlaceOrAddToPartialMove(draft, pos, variant);
        //TODO: react strict mode causes duplicated send.
        if (move) {
          sendMoveMessage(move);
        }
      });
    };

    const onMakeMove = (move: Move) => {
      if (observed) return;
      if (
        boardMode.type !== 'remote' ||
        game.actualGame.currentPlayer !== boardMode.localPlayer ||
        game.actualGame.gameState.type !== 'ongoing'
      ) {
        throw new Error('not your turn');
      }
      setGame((draft) => {
        if (!ui.canDoMove(draft, move)) {
          console.error('Invalid move:', move);
          return;
        }
        console.log('doing move', move);
        ui.doMove(draft, move);
        //TODO: react strict mode causes duplicated send.
        sendMoveMessage(move);
      });
    };

    const onTimeout = () => {
      setGame((draft) => {
        ui.checkTimeout(draft);
      });
    };
    const goToPly = (index: number) => {
      setGame((draft) => {
        ui.setPlyIndex(draft, index);
      });
    };
    const sendDrawOffer = (offer: boolean) => {
      sendMessage(`Game#${gameId} ${offer ? 'Offer' : 'Remove'}Draw`);
    };
    const sendUndoOffer = (offer: boolean) => {
      sendMessage(`Game#${gameId} ${offer ? 'Request' : 'Remove'}Undo`);
    };
    const doResign = () => {
      sendMessage(`Game#${gameId} Resign`);
    };
    return {
      onTimeout,
      onClickTile,
      onMakeMove,
      goToPly,
      sendDrawOffer,
      sendUndoOffer,
      doResign,
    };
  }, [
    setGame,
    boardMode,
    game.actualGame.currentPlayer,
    game.actualGame.gameState.type,
    gameId,
    sendMessage,
    observed,
    sendMoveMessage,
  ]);

  const currentCallbacks = useRef(gameCallbacks);
  useEffect(() => {
    currentCallbacks.current = gameCallbacks;
  }, [gameCallbacks]);

  const BoardComponent =
    boardType === '2d' ? Board2D : boardType === '3d' ? Board3D : BoardNinja;

  return (
    <div className="w-full grow flex flex-col">
      <BoardComponent
        game={game}
        playerInfo={playerInfo}
        mode={boardMode}
        callbacks={currentCallbacks}
        hasUndoOffer={
          boardMode.type === 'remote' ? gameInfo.undoOffer : undefined
        }
        hasDrawOffer={
          boardMode.type === 'remote' ? gameInfo.drawOffer : undefined
        }
      />
      <GameOverDialog game={game} playerInfo={playerInfo} gameId={gameId} />
    </div>
  );
}
