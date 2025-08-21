import { ui } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';
import { useSettings } from '../../settings';

export function Piece({ id, game }: { id: number; game: GameUI }) {
  const { themeParams } = useSettings();

  const size = ui.boardSize(game);
  const data = game.pieces[id];
  const height = data.isFloating ? data.height + 2 : data.height;
  const isWhite = data.player === 'white';

  const animationSetting = '150ms ease-in-out';

  const colors = isWhite ? themeParams.piece1 : themeParams.piece2;

  const pieceSize = themeParams.pieces.size;
  const wallWidthRatio = 2 / 5;
  const roundedPercent = themeParams.pieces.rounded;

  const radiusStr =
    data.variant === 'standing'
      ? `${roundedPercent.toString()}% ${(roundedPercent / wallWidthRatio).toString()}%`
      : data.variant === 'capstone'
        ? '100%'
        : `${roundedPercent.toString()}%`;

  const zIndex = data.zPriority !== null ? data.zPriority + 100 : height;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: `${(100 / size).toString()}%`,
        height: `${(100 / size).toString()}%`,
        transform: `translate(${(data.pos.x * 100).toString()}%, ${((size - 1 - data.pos.y) * 100 - height * 7).toString()}%)`,
        zIndex: zIndex,
        transition: `transform ${animationSetting}`,
        filter: 'drop-shadow(0 5px 5px rgb(0, 0, 0, 0.1))',
      }}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          animation: data.deleted
            ? 'scaleOut 150ms ease-out forwards'
            : 'scaleIn 150ms ease-out forwards',
        }}
      >
        <div
          className="outline"
          style={{
            width: `${pieceSize.toString()}%`,
            outlineWidth: themeParams.pieces.border,
            outlineColor:
              data.variant === 'capstone' && colors.capstoneOverride
                ? colors.capstoneOverride.border
                : colors.border,
            backgroundColor:
              data.variant === 'capstone' && colors.capstoneOverride
                ? colors.capstoneOverride.background
                : colors.background,
            height:
              data.variant === 'standing'
                ? `${(pieceSize * wallWidthRatio).toString()}%`
                : `${pieceSize.toString()}%`,
            borderBottomLeftRadius: radiusStr,
            borderBottomRightRadius: radiusStr,
            borderTopLeftRadius: radiusStr,
            borderTopRightRadius: radiusStr,
            transform: data.variant === 'standing' ? 'rotate(-45deg)' : '',
            transition: `width ${animationSetting}, height ${animationSetting}, transform ${animationSetting}`,
          }}
        ></div>
      </div>
    </div>
  );
}
