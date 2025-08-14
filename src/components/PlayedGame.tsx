import useWebSocket from 'react-use-websocket';
import { WS_URL, wsOptions } from '../websocket';
import { useEffect, useMemo, useState } from 'react';
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
import { Board3D } from './board3d/Board3D';

export function PlayedGame({
  gameId,
  settings,
}: {
  gameId: string;
  settings: GameSettings;
}) {
  const { sendMessage } = useWebSocket(WS_URL, {
    ...wsOptions,
    onOpen: () => {},
    onClose: () => {},
  });

  const gameData = useGameData();

  const [game, _setGame] = useState<ui.GameUI>(ui.newGameUI(newGame(settings)));
  const [readMessageIndex, setReadMessageIndex] = useState(0);
  const [receivedPlyIndex, setReceivedPlyIndex] = useState(0);

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

  function onMove(_player: Player, move: Move) {
    console.log('Sending move:', move);
    sendMoveMessage(move);
    setReceivedPlyIndex((prev) => prev + 1);
  }

  const gameEntry = useMemo(
    () => gameData.games.find((g) => g.id.toString() === gameId),
    [gameData.games, gameId],
  );

  //TODO: keep player info after game finishes. (in a ref, for example)
  const playerInfo = {
    white: { username: gameEntry?.white ?? 'White', rating: 1000 },
    black: { username: gameEntry?.black ?? 'Black', rating: 1000 },
  };

  return (
    <div className="w-full grow flex flex-col">
      <h2>Played Game</h2>
      <Board3D
        game={game}
        playerInfo={playerInfo}
        interactive={true}
        onMove={onMove}
      />
    </div>
  );
}
