import { FaRegUser, FaUser } from 'react-icons/fa6';
import type { Player } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';
import { Clock } from './Clock';
import { useMantineColorScheme } from '@mantine/core';

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
  const { colorScheme } = useMantineColorScheme();

  return (
    <div className="w-full flex flex-col p-2 gap-2 justify-between items-center">
      <div
        className="grid gap-2 items-center"
        style={{ gridTemplateColumns: 'auto 1fr auto' }}
      >
        {(player === 'white') !== (colorScheme === 'light') ? (
          <FaUser />
        ) : (
          <FaRegUser />
        )}
        <p className="font-bold overflow-hidden">{username}</p>
        <p>({rating})</p>
      </div>
      <div className="flex gap-2 items-center">
        <Clock game={game} onTimeout={onTimeout} player={player} />
      </div>
    </div>
  );
}
