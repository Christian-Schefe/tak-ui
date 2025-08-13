import type { Coord } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';

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
  const isEven = (pos.x + pos.y) % 2 === 0;
  const data = game.tiles[pos.y][pos.x];
  const color = data.selectable
    ? isEven
      ? 'bg-primary-500'
      : 'bg-primary-550'
    : isEven
      ? 'bg-gray-200'
      : 'bg-gray-300';
  const hoverColor = data.selectable
    ? 'hover:bg-primary-600'
    : 'hover:bg-gray-400';
  return (
    <div
      className={`relative flex items-center justify-center h-full w-full ${color} ${interactive && data.hoverable ? hoverColor : ''}`}
      style={{ transition: 'background-color 150ms ease-in-out' }}
      onClick={() => onClick()}
    ></div>
  );
}
