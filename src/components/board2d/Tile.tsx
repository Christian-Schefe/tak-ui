import type { Coord } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';

export function Tile({
  pos,
  game,
  onClick,
}: {
  pos: Coord;
  game: GameUI;
  onClick: () => void;
}) {
  const isEven = (pos.x + pos.y) % 2 === 0;
  const data = game.tiles[pos.y][pos.x];
  const color = data.selectable
    ? 'bg-primary-500'
    : isEven
      ? 'bg-gray-200'
      : 'bg-gray-300';
  return (
    <div
      className={`relative flex items-center justify-center h-full w-full ${color}`}
      style={{ transition: 'background-color 150ms ease-in-out' }}
      onClick={() => onClick()}
    ></div>
  );
}
