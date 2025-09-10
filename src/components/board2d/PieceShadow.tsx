import { logError } from '../../logger';
import { ui, type PieceId } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';
import { useSettings } from '../../useSettings';
import { AnimatePresence, motion } from 'motion/react';

export function PieceShadow({ id, game }: { id: PieceId; game: GameUI }) {
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

  const animationSetting = `${animationSpeed.toString()}ms ease-in-out`;

  const wallWidthRatio = 2 / 5;
  const roundedPercent = themeParams.pieces.rounded;

  const radiusStr =
    data.variant === 'standing'
      ? `${roundedPercent.toString()}% ${(roundedPercent / wallWidthRatio).toString()}%`
      : data.variant === 'capstone'
        ? '100%'
        : `${roundedPercent.toString()}%`;

  const xTransform = data.pos.x * 100 + (data.canBePicked ? 0 : 35);
  const yTransform =
    (size - 1 - data.pos.y) * 100 + (themeParams.pieces.shadow?.offsetY ?? 5);

  const hidden = data.deleted || !data.canBePicked;

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="piece-inner"
          className="absolute pointer-events-none flex items-center justify-center"
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
          }}
        >
          <div
            style={{
              width: `${pieceSize.toString()}%`,
              backgroundColor: themeParams.pieces.shadow?.color ?? '#000000',
              opacity: 1,
              height:
                data.variant === 'standing'
                  ? `${(pieceSize * wallWidthRatio).toString()}%`
                  : `${pieceSize.toString()}%`,
              borderBottomLeftRadius: radiusStr,
              borderBottomRightRadius: radiusStr,
              borderTopLeftRadius: radiusStr,
              borderTopRightRadius: radiusStr,
              transform: data.variant === 'standing' ? 'rotate(-45deg)' : '',
              transition: `width ${animationSetting}, height ${animationSetting}, transform ${animationSetting}, opacity ${animationSetting}`,
            }}
          ></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
