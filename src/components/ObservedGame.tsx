import useWebSocket from 'react-use-websocket';
import { msgToString, WS_URL, wsOptions } from '../websocket';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Board2D } from './board2d/Board2D';
import {
  ui,
  type GameSettings,
  type Move,
  type Player,
} from '../packages/tak-core';
import { newGame } from '../packages/tak-core/game';
import { moveFromString } from '../packages/tak-core/move';
import {
  dirFromAligned,
  dirToString,
  offsetCoord,
} from '../packages/tak-core/coord';
import { useGameData } from '../gameData';

export function ObservedGame({
  gameId,
  settings,
  interactive,
}: {
  gameId: string;
  settings: GameSettings;
  interactive: boolean;
}) {
  const subscriptionState: RefObject<
    'unsubscribed' | 'pending' | 'subscribed'
  > = useRef('unsubscribed');

  const { sendMessage } = useWebSocket(WS_URL, {
    ...wsOptions,
    onOpen: () => {
      if (
        !interactive &&
        gameId &&
        subscriptionState.current === 'unsubscribed'
      ) {
        subscriptionState.current = 'pending';
        console.log('Subscribing to game:', gameId);
        sendMessage(`Observe ${gameId}`);
      }
    },
    onClose: () => {
      subscriptionState.current = 'unsubscribed';
    },
  });

  const gameData = useGameData();

  const [game, _setGame] = useState<ui.GameUI>(ui.newGameUI(newGame(settings)));
  const [readMessageIndex, setReadMessageIndex] = useState(0);
  const [receivedPlyIndex, setReceivedPlyIndex] = useState(0);

  useEffect(() => {
    console.log('mounted');
    if (
      !interactive &&
      gameId &&
      subscriptionState.current === 'unsubscribed'
    ) {
      subscriptionState.current = 'pending';
      console.log('Subscribing to game:', gameId);
      sendMessage(`Observe ${gameId}`);
    }

    return () => {
      console.log('Cleaning up: Unsubscribing');
      if (!gameId || subscriptionState.current !== 'subscribed') return;
      console.log('Unsubscribing from game:', gameId);
      sendMessage(`Unobserve ${gameId}`);
      subscriptionState.current = 'unsubscribed';
    };
  }, [gameId]);

  useEffect(() => {
    if (!gameData.gameInfo[gameId]) return;
    const toRead = gameData.gameInfo[gameId].messages.length - readMessageIndex;
    let addedPlys = 0;
    for (let i = 0; i < toRead; i++) {
      const message = gameData.gameInfo[gameId].messages[readMessageIndex + i];
      console.log(
        gameData.gameInfo[gameId].messages.length,
        readMessageIndex + i,
      );
      if (!message) continue;

      if (message.startsWith(`Game#${gameId}`)) {
        console.log('Game message received:', message);
      }

      if (message.startsWith(`Observe ${gameId}`)) {
        console.log('Subscribed to game:', gameId);
        subscriptionState.current = 'subscribed';
      }

      const placeRegex = /Game#\d+ P ([A-Z])([1-9])(?: ([CW]))?/;
      const match = message.match(placeRegex);
      if (match) {
        const [, col, row] = match;
        const variant = match[3] ? (match[3] === 'C' ? 'C' : 'S') : '';
        const move = moveFromString(`${variant}${col.toLowerCase()}${row}`);

        if (game.actualGame.history.length <= receivedPlyIndex + addedPlys) {
          console.log('Piece placed:', { move });
          try {
            ui.doMove(game, move, false);
            addedPlys++;
          } catch (err) {
            console.error('desync: ', err);
          }
        }
      }

      const moveRegex = /Game#\d+ M ([A-Z])([1-9]) ([A-Z])([1-9])((?: [1-9])*)/;
      const moveMatch = message.match(moveRegex);
      if (moveMatch) {
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
        const move = moveFromString(
          `${dropNums.reduce((acc, n) => acc + n, 0)}${fromCol.toLowerCase()}${fromRow}${dirToString(dir)}${dropNums.join('')}`,
        );

        if (game.actualGame.history.length <= receivedPlyIndex + addedPlys) {
          console.log('Piece moved:', { move });
          try {
            ui.doMove(game, move, false);
            addedPlys++;
          } catch (err) {
            console.error('desync: ', err);
          }
        }
      }
    }
    setReadMessageIndex((prev) => prev + toRead);
    setReceivedPlyIndex((prev) => prev + addedPlys);
  }, [gameData.gameInfo[gameId]?.messages, readMessageIndex]);

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

  function onMove(player: Player, move: Move) {
    if (interactive) {
      console.log('Sending move:', move);
      sendMoveMessage(move);
      setReceivedPlyIndex((prev) => prev + 1);
    }
  }

  return (
    <div>
      <h2>Observed Game</h2>
      <Board2D game={game} interactive={interactive} onMove={onMove} />
    </div>
  );
}
