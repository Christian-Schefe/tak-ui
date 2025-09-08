import { type Player } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';
import { FaClock } from 'react-icons/fa6';
import { formatDuration } from '../../features/utils';
import { useClock } from '../../features/board';

export function Clock({
  game,
  onTimeout,
  player,
}: {
  game: GameUI;
  onTimeout: () => void;
  player: Player;
}) {
  const { timeRemaining, isActive } = useClock(game, player, onTimeout);

  return (
    <div
      className="py-1 px-3 rounded-md flex items-center gap-2 justify-between"
      style={{
        opacity: isActive ? 1 : 0.5,
        transition: 'opacity 150ms ease-in-out',
      }}
    >
      <FaClock
        className="w-4 h-4"
        style={{
          opacity: isActive ? 1 : 0.5,
          transition: 'opacity 150ms ease-in-out',
        }}
      />
      <p className="font-bold font-mono">
        {timeRemaining !== null ? formatDuration(timeRemaining) : '-:--'}
      </p>
    </div>
  );
}
