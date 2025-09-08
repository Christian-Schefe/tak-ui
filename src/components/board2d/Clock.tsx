import { type Player } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';
import { useSettings } from '../../settings';
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
  const {
    themeParams,
    boardSettings: {
      board2d: { animationSpeed },
    },
  } = useSettings();

  const { timeRemaining, isActive } = useClock(game, player, onTimeout);

  return (
    <div
      className="py-1 px-3 rounded-md flex items-center gap-2 justify-between"
      style={{
        backgroundColor:
          player === 'white'
            ? themeParams.piece1.background
            : themeParams.piece2.background,
        color:
          player === 'white'
            ? (themeParams.piece1.text ?? themeParams.piece1.border)
            : (themeParams.piece2.text ?? themeParams.piece2.border),
        opacity: isActive ? 1 : 0.5,
        transition: `opacity ${animationSpeed.toString()}ms ease-in-out`,
      }}
    >
      <FaClock
        className="w-4 h-4"
        style={{
          opacity: isActive ? 1 : 0.5,
          transition: `opacity ${animationSpeed.toString()}ms ease-in-out`,
        }}
      />
      <p className="font-bold font-mono">
        {timeRemaining !== null ? formatDuration(timeRemaining) : '-:--'}
      </p>
    </div>
  );
}
