import { useEffect, useMemo } from 'react';
import type { PieceVariant, Player } from '../../packages/tak-core';
import { useSettings } from '../../settings';
import type { GameUI } from '../../packages/tak-core/ui';

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

  const remaining = game.actualGame.reserves[player];

  const disabledVariants = useMemo(
    () =>
      Object.fromEntries(
        pieceVariants.map((v) => [
          v,
          (v === 'capstone'
            ? remaining.capstones === 0
            : remaining.pieces === 0) &&
            (game.actualGame.history.length >= 2 || v === 'flat'),
        ]),
      ) as Record<PieceVariant, boolean>,
    [remaining, game.actualGame.history.length],
  );

  useEffect(() => {
    if (disabledVariants[variant] && !disabledVariants.capstone) {
      setVariant('capstone');
    } else if (disabledVariants[variant] && !disabledVariants.flat) {
      setVariant('flat');
    }
  }, [remaining, setVariant, variant, disabledVariants]);

  const opacityTransition = `opacity ${animationSpeed.toString()}ms ease-in-out`;

  return (
    <div className="w-full flex p-2 gap-2" style={{ color: themeParams.text }}>
      {pieceVariants.map((v) => {
        const isDisabled =
          (v === 'capstone'
            ? remaining.capstones === 0
            : remaining.pieces === 0) &&
          (game.actualGame.history.length >= 2 || v === 'flat');
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
