import type { Player } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';
import { useSettings } from '../../settings';
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
  const { themeParams } = useSettings();
  const reserve = game.actualGame.reserves[player];
  return (
    <div className="w-full flex p-2 gap-2 justify-between items-center">
      <div
        className="grid gap-2 items-center"
        style={{ color: themeParams.text, gridTemplateColumns: '1fr auto' }}
      >
        <p className="font-bold overflow-hidden">{username}</p>
        <p>({rating})</p>
      </div>
      <div className="flex gap-2 items-center">
        <p className="font-bold" style={{ color: themeParams.text }}>
          {reserve.pieces}/{reserve.capstones}
        </p>
        <Clock player={player} game={game} onTimeout={onTimeout} />
      </div>
    </div>
  );
}
