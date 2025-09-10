import type { PieceVariant, Player } from '../../packages/tak-core';
import { useSettings } from '../../useSettings';
import type { GameUI } from '../../packages/tak-core/ui';
import { useVariantSelector } from '../../features/variantSelector';

const pieceVariants: PieceVariant[] = ['flat', 'standing', 'capstone'];

export function VariantSelector({
  variant,
  game,
  player,
  setVariant,
}: {
  variant: PieceVariant;
  game: GameUI;
  player: Player;
  setVariant: (variant: PieceVariant) => void;
}) {
  const {
    themeParams,
    boardSettings: {
      board2d: { animationSpeed },
    },
  } = useSettings();

  const { disabledVariants } = useVariantSelector(
    game,
    player,
    variant,
    setVariant,
  );

  const opacityTransition = `opacity ${animationSpeed.toString()}ms ease-in-out`;

  return (
    <div className="w-full flex p-2 gap-2" style={{ color: themeParams.text }}>
      {pieceVariants.map((v) => {
        const isDisabled = disabledVariants[v];
        return (
          <button
            key={v}
            className="relative grow w-0 h-12 rounded-md"
            onClick={() => {
              setVariant(v);
            }}
            disabled={isDisabled}
            style={{
              backgroundColor: themeParams.board1,
              opacity: isDisabled ? 0.5 : 1,
              transition: opacityTransition,
            }}
          >
            <div
              style={{
                backgroundColor: themeParams.hover,
                transition: opacityTransition,
              }}
              className={`absolute inset-0 rounded-md opacity-0 ${!isDisabled ? 'hover:opacity-100' : ''}`}
            ></div>
            <div
              className="absolute inset-0 rounded-md pointer-events-none"
              style={{
                backgroundColor: themeParams.highlight,
                opacity: !isDisabled && variant === v ? 1 : 0,
                transition: opacityTransition,
              }}
            ></div>
            <p
              className="absolute flex items-center justify-center inset-0 pointer-events-none font-bold"
              style={{ color: themeParams.text }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
