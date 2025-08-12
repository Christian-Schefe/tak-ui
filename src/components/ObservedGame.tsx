import useWebSocket from 'react-use-websocket';
import { msgToString, WS_URL, wsOptions } from '../websocket';
import { useEffect, useState } from 'react';
import { Board2D } from './board2d/Board2D';
import { ui } from '../packages/tak-core';
import { newGame } from '../packages/tak-core/game';
import { moveFromString } from '../packages/tak-core/move';
import { dirFromAligned, dirToString } from '../packages/tak-core/coord';

export function ObservedGame({ gameId }: { gameId: string }) {
  const { sendMessage, lastMessage } = useWebSocket(WS_URL, wsOptions);

  const [game, setGame] = useState<ui.GameUI>(ui.newGameUI(newGame(5, 2)));

  useEffect(() => {
    // TODO: React Strict Mode causing problems
    if (!gameId) return;
    console.log('Subscribing to game:', gameId);
    sendMessage(`Observe ${gameId}`);
    return () => {
      console.log('Unsubscribing from game:', gameId);
      sendMessage(`Unobserve ${gameId}`);
      setGame(ui.newGameUI(newGame(5, 2)));
    };
  }, [gameId]);

  useEffect(() => {
    async function handleMessage() {
      if (!lastMessage) return;
      const message = await msgToString(lastMessage);
      if (!message) return;

      if (message.startsWith(`Game#${gameId}`)) {
        console.log('Game message received:', message);
      }

      const placeRegex = /Game#\d+ P ([A-Z])([1-9])(?: ([CW]))?/;
      const match = message.match(placeRegex);
      if (match) {
        const [, col, row] = match;
        const variant = match[3] ? (match[3] === 'C' ? 'C' : 'S') : '';
        const move = moveFromString(`${variant}${col.toLowerCase()}${row}`);
        console.log('Piece placed:', { move });
        ui.doMove(game, move);
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
        const dir = dirFromAligned({ x: fromX, y: fromY }, { x: toX, y: toY })!;
        const move = moveFromString(
          `${dropNums.reduce((acc, n) => acc + n, 0)}${fromCol.toLowerCase()}${fromRow}${dirToString(dir)}${dropNums.join('')}`,
        );
        console.log('Piece moved:', { move });
        ui.doMove(game, move);
      }
    }
    handleMessage();
  }, [lastMessage]);

  return (
    <div>
      <h2>Observed Game</h2>
      <Board2D game={game} interactive={false} />
    </div>
  );
}
