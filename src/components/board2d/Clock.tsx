import { useRafLoop } from 'react-use';
import { type Player } from '../../packages/tak-core';
import { getTimeRemaining } from '../../packages/tak-core/game';
import type { GameUI } from '../../packages/tak-core/ui';
import { useMemo, useState } from 'react';
import { useSettings } from '../../settings';

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
    getTimeRemaining(game.actualGame, player, new Date()) ?? 0,
  );

  const { seconds, minutes } = useMemo(() => {
    const fullSeconds = Math.floor(timeRemaining / 1000);
    return { seconds: fullSeconds % 60, minutes: Math.floor(fullSeconds / 60) };
  }, [timeRemaining]);

  useRafLoop(() => {
    const remaining = getTimeRemaining(game.actualGame, player, new Date());
    if (
      game.actualGame.gameState.type === 'ongoing' &&
      remaining !== null &&
      remaining === 0
    ) {
      onTimeout();
    }
    setTimeRemaining(remaining ?? 0);
  }, true);

  return (
    <div
      className="py-1 px-4 rounded-md"
      style={{
        backgroundColor:
          player === 'white'
            ? themeParams.piece1.background
            : themeParams.piece2.background,
        color:
          player === 'white'
            ? themeParams.piece1.text ?? themeParams.piece1.border
            : themeParams.piece2.text ?? themeParams.piece2.border,
      }}
    >
      <p className='font-bold font-mono'>{`${minutes}:${seconds.toString().padStart(2, '0')}`}</p>
    </div>
  );
}
