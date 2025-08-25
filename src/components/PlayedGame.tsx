import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ui,
  type Coord,
  type GameSettings,
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
import { type GameListEntry } from '../gameData';
import { Board3D } from './board3d/Board3D';
import { useImmer } from 'use-immer';
import { useAuth, useWSAPI } from '../authHooks';
import { useSettings } from '../settings';
import { Board2D } from './board2d/Board2D';
import { GameOverDialog } from './GameOverDialog';
import { notifications } from '@mantine/notifications';
import { useGameData } from '../gameDataHooks';
import { ReadyState } from 'react-use-websocket';
import type { BoardMode } from './board';
import { BoardNinja } from './boardNinja/BoardNinja';
import { useRatings } from '../api/ratings';

const placeRegex = /Game#\d+ P ([A-Z])([1-9])(?: ([CW]))?/;
const moveRegex = /Game#\d+ M ([A-Z])([1-9]) ([A-Z])([1-9])((?: [1-9])*)/;

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

  const boardMode: BoardMode = useMemo(() => {
    if (observed) return { type: 'spectator' };
    if (user?.username === gameEntry.white)
      return { type: 'remote', localPlayer: 'white' };
    if (user?.username === gameEntry.black)
      return { type: 'remote', localPlayer: 'black' };
    return { type: 'spectator' };
  }, [observed, user?.username, gameEntry.white, gameEntry.black]);

  const { sendMessage, readyState } = useWSAPI();

  const gameData = useGameData();
  const maybeGameOver = gameData.gameInfo[gameId]?.gameOver;

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

  const [game, setGame] = useImmer<ui.GameUI>(() => {
    console.log('Creating new game with settings:', settings);
    return ui.newGameUI(newGame(settings));
  });

  const resetGame = useCallback(() => {
    setGame(() => {
      console.log('Resetting game to new game with settings:', settings);
      return ui.newGameUI(newGame(settings));
    });
    setReadMessageIndex(0);
  }, [settings, setGame]);

  useEffect(() => {
    if (maybeGameOver) {
      if (game.actualGame.gameState.type !== maybeGameOver.type) {
        console.log('received game over:', maybeGameOver);
        setGame((draft) => {
          draft.actualGame.gameState = maybeGameOver;
          ui.onGameUpdate(draft);
        });
      }
    }
  }, [maybeGameOver, game.actualGame.gameState, setGame]);

  const [readMessageIndex, setReadMessageIndex] = useState(0);

  useEffect(() => {
    resetGame();
    if (showNotifications.current) {
      notifications.show({
        title: 'Game Id Changed',
        message: `Game ID changed to: ${gameId}`,
        position: 'top-right',
      });
    }
  }, [gameId, resetGame]);

  const gameInfo = gameData.gameInfo[gameId];
  const hasGameInfo = !!gameInfo;

  useEffect(() => {
    if (!hasGameInfo) {
      resetGame();
      if (showNotifications.current) {
        notifications.show({
          title: 'Reset game state',
          message: 'Reset game as game data was removed',
          position: 'top-right',
        });
      }
    }
  }, [hasGameInfo, resetGame]);

  const moveMessages = gameInfo?.moveMessages;

  useEffect(() => {
    if (!moveMessages) return;
    const toRead = moveMessages.length - readMessageIndex;

    console.log(moveMessages.length, readMessageIndex, toRead);

    const moves: Move[] = [];

    for (let i = 0; i < toRead; i++) {
      const message = moveMessages[readMessageIndex + i];
      console.log(moveMessages.length, readMessageIndex + i, message);

      const placeMatch = placeRegex.exec(message);
      const moveMatch = moveRegex.exec(message);

      if (placeMatch) {
        const [, col, row] = placeMatch;
        const variant = placeMatch[3]
          ? placeMatch[3] === 'C'
            ? 'C'
            : 'S'
          : '';
        moves.push(moveFromString(`${variant}${col.toLowerCase()}${row}`));
      } else if (moveMatch) {
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
        } else {
          moves.push(
            moveFromString(
              `${dropNums.reduce((acc, n) => acc + n, 0).toString()}${fromCol.toLowerCase()}${fromRow}${dirToString(dir)}${dropNums.join('')}`,
            ),
          );
        }
      } else {
        console.error('Failed to parse move message:', message);
      }
    }
    setReadMessageIndex((prev) => prev + toRead);
    setGame((draft) => {
      try {
        for (const move of moves) {
          ui.doMove(draft, move);
        }
      } catch (err) {
        console.error('desync: ', err);
      }
    });
  }, [setGame, moveMessages, readMessageIndex, game.actualGame.currentPlayer]);

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

  const playerInfo = {
    white: {
      username: gameEntry.white,
      rating:
        ratings.data.find((r) => r?.name === gameEntry.white)?.rating ?? 1000,
    },
    black: {
      username: gameEntry.black,
      rating:
        ratings.data.find((r) => r?.name === gameEntry.black)?.rating ?? 1000,
    },
  };

  const timeMessages = gameInfo?.timeMessages;
  const lastTimeMessage = timeMessages
    ? timeMessages[timeMessages.length - 1]
    : null;
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

  const drawProps = useMemo(() => {
    return boardMode.type === 'remote'
      ? {
          hasDrawOffer: gameInfo?.drawOffer ?? false,
          sendDrawOffer: (offer: boolean) => {
            sendMessage(`Game#${gameId} ${offer ? 'Offer' : 'Remove'}Draw`);
          },
        }
      : undefined;
  }, [boardMode.type, gameInfo, gameId, sendMessage]);

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
    return { onTimeout, onClickTile, onMakeMove };
  }, [
    setGame,
    boardMode,
    game.actualGame.currentPlayer,
    game.actualGame.gameState.type,
    observed,
    sendMoveMessage,
  ]);

  const currentCallbacks = useRef(gameCallbacks);
  useEffect(() => {
    currentCallbacks.current = gameCallbacks;
  }, [gameCallbacks]);

  const BoardComponent =
    boardType === '2d' ? Board2D : boardType === '3d' ? Board3D : BoardNinja;

  const doResign = useMemo(() => {
    return boardMode.type === 'remote'
      ? () => {
          sendMessage(`Game#${gameId} Resign`);
        }
      : undefined;
  }, [gameId, sendMessage, boardMode.type]);

  return (
    <div className="w-full grow flex flex-col">
      <BoardComponent
        game={game}
        setGame={setGame}
        playerInfo={playerInfo}
        mode={boardMode}
        callbacks={currentCallbacks}
        drawProps={drawProps}
        doResign={doResign}
      />
      <GameOverDialog game={game} playerInfo={playerInfo} />
    </div>
  );
}
