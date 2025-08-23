import { useRafLoop } from 'react-use';
import { type Player } from '../../packages/tak-core';
import { getTimeRemaining, isClockActive } from '../../packages/tak-core/game';
import type { GameUI } from '../../packages/tak-core/ui';
import { useMemo, useState } from 'react';
import { useSettings } from '../../settings';
import { FaClock } from 'react-icons/fa';

export function Clock({
  game,
  onTimeout,
  player,
}: {
  game: GameUI;
  onTimeout: () => void;
  player: Player;
}) {
  const { themeParams } = useSettings();

  const [timeRemaining, setTimeRemaining] = useState(
    getTimeRemaining(game.actualGame, player, new Date()),
  );

  const { seconds, minutes } = useMemo(() => {
    const fullSeconds = Math.floor((timeRemaining ?? 0) / 1000);
    return { seconds: fullSeconds % 60, minutes: Math.floor(fullSeconds / 60) };
  }, [timeRemaining]);

  useRafLoop(() => {
    const remaining = getTimeRemaining(game.actualGame, player, new Date());
    if (
      isClockActive(game.actualGame, player) &&
      remaining !== null &&
      remaining === 0
    ) {
      onTimeout();
    }
    setTimeRemaining(remaining);
  }, true);

  const isActive =
    player === game.actualGame.currentPlayer &&
    game.actualGame.gameState.type === 'ongoing';

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
        {timeRemaining !== null
          ? `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`
          : '-:--'}
      </p>
    </div>
  );
}
