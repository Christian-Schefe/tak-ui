import { logError } from '../../logger';
import { ui, type PieceId } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';
import { useSettings } from '../../settings';
import { AnimatePresence, motion } from 'motion/react';

export function Piece({ id, game }: { id: PieceId; game: GameUI }) {
  const {
    themeParams,
    boardSettings: {
      board2d: { animationSpeed, pieceSize },
    },
  } = useSettings();

  const size = ui.boardSize(game);
  const data = game.pieces[id];

  if (!data) {
    logError('Piece does not exist. This should never happen');
    return null;
  }

  const effectiveHeight = data.canBePicked
    ? data.height - data.buriedPieceCount
    : data.height;
  const height = data.isFloating ? effectiveHeight + 2 : effectiveHeight;
  const isWhite = data.player === 'white';

  const animationSetting = `${animationSpeed.toString()}ms ease-in-out`;

  const colors = isWhite ? themeParams.piece1 : themeParams.piece2;

  const wallWidthRatio = 2 / 5;
  const roundedPercent = themeParams.pieces.rounded;
  const buriedSizeFactor = 0.25;

  const radiusStr =
    data.variant === 'standing'
      ? `${roundedPercent.toString()}% ${(roundedPercent / wallWidthRatio).toString()}%`
      : data.variant === 'capstone'
        ? '100%'
        : `${roundedPercent.toString()}%`;

  const buriedLimit = 12;
  const buriedHeightOffset = Math.max(
    0,
    data.buriedPieceCount - (buriedLimit - 1),
  );

  const actualHeight = data.canBePicked ? height : height - buriedHeightOffset;

  const zIndex =
    data.zPriority !== null
      ? data.zPriority + 50
      : data.canBePicked
        ? actualHeight + 30
        : Math.max(-12, actualHeight + 12);

  const xTransform = data.pos.x * 100 + (data.canBePicked ? 0 : 35);
  const yTransform =
    (size - 1 - data.pos.y) * 100 -
    actualHeight * 7 +
    (data.canBePicked ? 0 : 35);

  const hidden =
    data.deleted ||
    (!data.canBePicked && data.buriedPieceCount - height >= buriedLimit);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="piece-inner"
          className="absolute pointer-events-none"
          initial={{
            x: `${xTransform.toString()}%`,
            y: `${yTransform.toString()}%`,
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            x: `${xTransform.toString()}%`,
            y: `${yTransform.toString()}%`,
            opacity: 1,
            scale: 1,
          }}
          exit={{
            x: `${xTransform.toString()}%`,
            y: `${yTransform.toString()}%`,
            opacity: 0,
            scale: 0.8,
          }}
          transition={{
            duration: animationSpeed / 1000,
            type: 'tween',
            ease: 'easeInOut',
          }}
          style={{
            width: `${(100 / size).toString()}%`,
            height: `${(100 / size).toString()}%`,
            zIndex: zIndex,
            filter: 'drop-shadow(0 5px 5px rgb(0, 0, 0, 0.1))',
          }}
        >
          <motion.div className="w-full h-full flex items-center justify-center">
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
