import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { ui, type GameSettings, type Move } from '../packages/tak-core';
import { newGame, setTimeRemaining } from '../packages/tak-core/game';
import { moveFromString } from '../packages/tak-core/move';
import {
  dirFromAligned,
  dirToString,
  offsetCoord,
} from '../packages/tak-core/coord';
import { type GameListEntry, useGameData } from '../gameData';
import { Board3D } from './board3d/Board3D';
import { useImmer } from 'use-immer';
import { useWSListener } from '../authHooks';
import { useSettings } from '../settings';
import { Board2D } from './board2d/Board2D';

const placeRegex = /Game#\d+ P ([A-Z])([1-9])(?: ([CW]))?/;
const moveRegex = /Game#\d+ M ([A-Z])([1-9]) ([A-Z])([1-9])((?: [1-9])*)/;

export function PlayedGame({
  gameId,
  settings,
  observed,
}: {
  gameId: string;
  settings: GameSettings;
  observed: boolean;
}) {
  const subscriptionState: RefObject<
    'unsubscribed' | 'pending' | 'subscribed'
  > = useRef('unsubscribed');

  const { sendMessage } = useWSListener({
    onClose: () => {
      subscriptionState.current = 'unsubscribed';
    },
    onOpen: () => {
      if (observed && gameId && subscriptionState.current === 'unsubscribed') {
        subscriptionState.current = 'pending';
        console.log('Subscribing to game:', gameId);
        gameData.removeGameInfo(gameId);
        sendMessage(`Observe ${gameId}`);
      }
    },
  });

  const gameData = useGameData();

  const [game, setGame] = useImmer<ui.GameUI>(() => {
    const game = ui.newGameUI(newGame(settings));
    if (!observed) {
      game.onMove = (_player, move) => sendMoveMessage(move);
    }
    return game;
  });

  const resetGame = useCallback(() => {
    console.log('resetting game');
    setGame(() => ui.newGameUI(newGame(settings)));
  }, [setGame, settings]);

  useEffect(() => {
    if (observed && gameId && subscriptionState.current === 'unsubscribed') {
      subscriptionState.current = 'pending';
      console.log('Subscribing to game:', gameId);
      gameData.removeGameInfo(gameId);
      sendMessage(`Observe ${gameId}`);
    }
    return () => {
      if (!gameId || !observed || subscriptionState.current !== 'subscribed')
        return;
      console.log('Unsubscribing from game:', gameId);
      sendMessage(`Unobserve ${gameId}`);
      gameData.removeGameInfo(gameId);
      subscriptionState.current = 'unsubscribed';
    };
  }, [observed, gameData, sendMessage, gameId]);

  const [readMessageIndex, setReadMessageIndex] = useState(0);

  const moveMessages = gameData.gameInfo[gameId]?.moveMessages;

  useEffect(() => {
    if (!moveMessages) return;
    if (readMessageIndex === 0) {
      resetGame();
    }
    const toRead = moveMessages.length - readMessageIndex;

    console.log(moveMessages.length, readMessageIndex, toRead);

    const moves: Move[] = [];

    for (let i = 0; i < toRead; i++) {
      const message = moveMessages[readMessageIndex + i];
      console.log(moveMessages.length, readMessageIndex + i, message);

      const placeMatch = message.match(placeRegex);
      const moveMatch = message.match(moveRegex);

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
        const dir = dirFromAligned({ x: toX, y: toY }, { x: fromX, y: fromY })!;
        moves.push(
          moveFromString(
            `${dropNums.reduce((acc, n) => acc + n, 0)}${fromCol.toLowerCase()}${fromRow}${dirToString(dir)}${dropNums.join('')}`,
          ),
        );
      } else {
        console.error('Failed to parse move message:', message);
      }
    }
    setReadMessageIndex((prev) => prev + toRead);
    setGame((draft) => {
      try {
        for (const move of moves) {
          ui.doMove(draft, move, false);
        }
      } catch (err) {
        console.error('desync: ', err);
      }
    });
  }, [setGame, resetGame, moveMessages, readMessageIndex]);

  function sendMoveMessage(move: Move) {
    if (move.type === 'place') {
      const col = String.fromCharCode(move.pos.x + 'A'.charCodeAt(0));
      const row = move.pos.y + 1;
      const variant =
        move.variant === 'capstone'
          ? ' C'
          : move.variant === 'standing'
            ? ' W'
            : '';
      sendMessage(`Game#${gameId} P ${col}${row}${variant}`);
    } else {
      const fromCol = String.fromCharCode(move.from.x + 'A'.charCodeAt(0));
      const fromRow = move.from.y + 1;
      const to = offsetCoord(move.from, move.dir, move.drops.length);
      const toCol = String.fromCharCode(to.x + 'A'.charCodeAt(0));
      const toRow = to.y + 1;
      const drops = move.drops.join(' ');
      sendMessage(
        `Game#${gameId} M ${fromCol}${fromRow} ${toCol}${toRow} ${drops}`,
      );
    }
  }

  const gameEntry = useRef<GameListEntry>(
    gameData.games.find((g) => g.id.toString() === gameId) ??
      (() => {
        throw new Error('Game not found');
      })(),
  );

  const playerInfo = {
    white: { username: gameEntry.current.white, rating: 1000 },
    black: { username: gameEntry.current.black, rating: 1000 },
  };

  const timeMessages = gameData.gameInfo[gameId]?.timeMessages;
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

  return (
    <div className="w-full grow flex flex-col">
      {boardType === '2d' && (
        <Board2D
          game={game}
          setGame={setGame}
          playerInfo={playerInfo}
          interactive={!observed}
        />
      )}
      {boardType === '3d' && (
        <Board3D
          game={game}
          setGame={setGame}
          playerInfo={playerInfo}
          interactive={!observed}
        />
      )}
    </div>
  );
}
