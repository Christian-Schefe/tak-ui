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
  rating?: number;
  game: GameUI;
  onTimeout: () => void;
}) {
  const {
    themeParams,
    boardSettings: {
      board2d: { animationSpeed },
    },
  } = useSettings();
  const reserve =
    game.shownReserves?.[player] ?? game.actualGame.reserves[player];
  const colors = player === 'white' ? themeParams.piece1 : themeParams.piece2;
  const isCurrent =
    game.actualGame.currentPlayer === player &&
    game.actualGame.gameState.type === 'ongoing';
  return (
    <div className="w-full flex p-2 gap-2 justify-between items-center">
      <div
        className="grid gap-2 items-center"
        style={{ color: themeParams.text, gridTemplateColumns: '1fr auto' }}
      >
        <p className="font-bold overflow-hidden">{username}</p>
        {rating !== undefined && <p>({rating})</p>}
      </div>
      <div className="flex gap-2 items-center">
        <div
          className="font-bold flex gap-2 items-center px-2 py-1 rounded-md"
          style={{
            color: themeParams.text,
            backgroundColor: themeParams.board1,
            opacity: isCurrent ? 1 : 0.75,
            transition: `opacity ${animationSpeed.toString()}ms ease-in-out`,
          }}
        >
          {reserve.pieces}
          <div
            className="w-3 h-3 outline-2"
            style={{
              backgroundColor: colors.background,
              outlineColor: colors.border,
              borderRadius: `${themeParams.pieces.rounded.toString()}%`,
            }}
          />
          <p className="ml-1">{reserve.capstones}</p>
          <div
            className="w-3 h-3 outline-2 rounded-full"
            style={{
              backgroundColor: colors.background,
              outlineColor: colors.border,
            }}
          />
        </div>
        <Clock player={player} game={game} onTimeout={onTimeout} />
      </div>
    </div>
  );
}
