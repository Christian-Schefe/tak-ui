import { ui, type PieceId } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';
import { useSettings } from '../../settings';

export function Piece({ id, game }: { id: PieceId; game: GameUI }) {
  const {
    themeParams,
    boardSettings: {
      board2d: { animationSpeed },
    },
  } = useSettings();

  const size = ui.boardSize(game);
  const data = game.pieces[id];

  if (!data) {
    console.error('Piece does not exist. This should never happen');
    return null;
  }

  const effectiveHeight = data.canBePicked
    ? data.height - data.buriedPieceCount
    : data.height;
  const height = data.isFloating ? effectiveHeight + 2 : effectiveHeight;
  const isWhite = data.player === 'white';

  const animationSetting = `${animationSpeed.toString()}ms ease-in-out`;

  const colors = isWhite ? themeParams.piece1 : themeParams.piece2;

  const pieceSize = themeParams.pieces.size;
  const wallWidthRatio = 2 / 5;
  const roundedPercent = themeParams.pieces.rounded;
  const buriedSizeFactor = 0.25;

  const radiusStr =
    data.variant === 'standing'
      ? `${roundedPercent.toString()}% ${(roundedPercent / wallWidthRatio).toString()}%`
      : data.variant === 'capstone'
        ? '100%'
        : `${roundedPercent.toString()}%`;

  const zIndex =
    data.zPriority !== null
      ? data.zPriority + 50
      : data.canBePicked
        ? height + 20
        : height;

  const buriedLimit = 12;
  const buriedHeightOffset = Math.max(
    0,
    data.buriedPieceCount - (buriedLimit - 1),
  );

  const xTransform = data.pos.x * 100 + (data.canBePicked ? 0 : 35);
  const yTransform =
    (size - 1 - data.pos.y) * 100 -
    (data.canBePicked ? height : height - buriedHeightOffset) * 7 +
    (data.canBePicked ? 0 : 35);

  const hidden =
    !data.canBePicked && data.buriedPieceCount - height >= buriedLimit;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: `${(100 / size).toString()}%`,
        height: `${(100 / size).toString()}%`,
        transform: `translate(${xTransform.toString()}%, ${yTransform.toString()}%)`,
        zIndex: zIndex,
        transition: `transform ${animationSetting}, opacity ${animationSetting}`,
        opacity: hidden ? 0 : 1,
        filter: 'drop-shadow(0 5px 5px rgb(0, 0, 0, 0.1))',
      }}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          animation: data.deleted
            ? `scaleOut ${animationSpeed.toString()}ms ease-out forwards`
            : `scaleIn ${animationSpeed.toString()}ms ease-out forwards`,
        }}
      >
        <div
          className="outline"
          style={{
            width: data.canBePicked
              ? `${pieceSize.toString()}%`
              : `${(pieceSize * buriedSizeFactor).toString()}%`,
            outlineWidth: themeParams.pieces.border,
            outlineColor:
              data.variant === 'capstone' && colors.capstoneOverride
                ? colors.capstoneOverride.border
                : colors.border,
            backgroundColor:
              data.variant === 'capstone' && colors.capstoneOverride
                ? colors.capstoneOverride.background
                : colors.background,
            height: data.canBePicked
              ? data.variant === 'standing'
                ? `${(pieceSize * wallWidthRatio).toString()}%`
                : `${pieceSize.toString()}%`
              : `${(pieceSize * buriedSizeFactor).toString()}%`,
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
