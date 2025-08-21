import { useMemo } from 'react';
import type { Coord } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';
import { useSettings } from '../../settings';
import Color from 'colorjs.io';

export function Tile({
  pos,
  game,
  interactive,
  onClick,
}: {
  pos: Coord;
  game: GameUI;
  interactive: boolean;
  onClick: () => void;
}) {
  const { themeParams, board2dSettings } = useSettings();

  const boardSize = game.actualGame.board.size;

  const colorIndex = useMemo(() => {
    const isEven = (pos.x + pos.y) % 2 === 0;
    const ringCount = Math.ceil(boardSize / 2);
    const ringIndex =
      Math.min(pos.x, pos.y, boardSize - 1 - pos.x, boardSize - 1 - pos.y) /
      (ringCount - 1);

    switch (themeParams.board.tiling) {
      case 'checkerboard':
        return isEven ? 0 : 1;
      case 'rings':
        return ringIndex;
      case 'linear':
        return (pos.x + pos.y) / (2 * (boardSize - 1));
      default:
        return 0;
    }
  }, [pos, boardSize, themeParams.board.tiling]);

  const data = game.tiles[pos.y][pos.x];
  const isHover = interactive && data.hoverable;

  const backgroundColorEven = new Color(themeParams.board1);
  const backgroundColorOdd = new Color(themeParams.board2);

  const backgroundColor = backgroundColorEven.mix(
    backgroundColorOdd,
    colorIndex,
  );

  return (
    <div
      className={'relative flex items-center justify-center h-full w-full'}
      onClick={() => {
        onClick();
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transition: 'background-color 150ms ease-in-out',
          backgroundColor: backgroundColor.toString(),
          margin: themeParams.board.spacing,
          borderRadius: themeParams.board.rounded,
        }}
      ></div>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: themeParams.highlight,
          opacity: data.lastMove ? 1 : 0,
          transition: 'opacity 150ms ease-in-out',
          margin: themeParams.board.spacing,
          borderRadius: themeParams.board.rounded,
        }}
      ></div>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: themeParams.hover,
          opacity: data.selectable ? 0.8 : 0,
          transition: 'opacity 150ms ease-in-out',
          margin: themeParams.board.spacing,
          borderRadius: themeParams.board.rounded,
        }}
      ></div>
      <div
        className={`absolute inset-0 opacity-0 ${isHover ? 'hover:opacity-100' : ''}`}
        style={{
          backgroundColor: themeParams.hover,
          transition: 'opacity 150ms ease-in-out',
          margin: themeParams.board.spacing,
          borderRadius: themeParams.board.rounded,
        }}
      ></div>
      {pos.y === 0 && board2dSettings.axisLabels ? (
        <div
          className={
            'flex absolute right-1 bottom-0 justify-end items-end font-mono font-bold opacity-70'
          }
          style={{
            color: themeParams.text,
            fontSize: board2dSettings.axisLabelSize,
          }}
        >
          {pos.x + 1}
        </div>
      ) : null}
      {pos.x === 0 && board2dSettings.axisLabels ? (
        <div
          className={
            'flex absolute left-1 top-0 justify-end items-end font-mono font-bold opacity-70'
          }
          style={{
            color: themeParams.text,
            fontSize: board2dSettings.axisLabelSize,
          }}
        >
          {String.fromCharCode('A'.charCodeAt(0) + pos.y).toUpperCase()}
        </div>
      ) : null}
    </div>
  );
}
