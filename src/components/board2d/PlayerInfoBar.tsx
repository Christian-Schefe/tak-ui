import type { Player } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';
import { Clock } from './Clock';

export function PlayerInfoBar({
  player,
  username,
  rating,
  game,
  onTimeout,
}: {
  player: Player;
  username: string;
  rating: number;
  game: GameUI;
  onTimeout: () => void;
}) {
  return (
    <div className="w-full flex p-2 gap-2 justify-between">
      <div className="flex gap-2 items-center">
        <p
          className={`font-bold ${game.actualGame.currentPlayer === player ? 'text-primary-500' : ''}`}
        >
          {username}
        </p>{' '}
        ({rating})
      </div>
      <Clock player={player} game={game} onTimeout={onTimeout} />
    </div>
  );
}
