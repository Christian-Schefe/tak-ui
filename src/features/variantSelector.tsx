import { useEffect, useMemo } from 'react';
import type { PieceVariant, Player } from '../packages/tak-core';
import type { GameUI } from '../packages/tak-core/ui';

const pieceVariants: PieceVariant[] = ['flat', 'standing', 'capstone'];

export function useVariantSelector(
  game: GameUI,
  player: Player,
  variant: PieceVariant,
  setVariant: (variant: PieceVariant) => void,
) {
  const remaining = game.actualGame.reserves[player];

  const disabledVariants = useDisabledVariants(game, player);

  useEffect(() => {
    if (disabledVariants[variant] && !disabledVariants.capstone) {
      setVariant('capstone');
    } else if (disabledVariants[variant] && !disabledVariants.flat) {
      setVariant('flat');
    }
  }, [remaining, setVariant, variant, disabledVariants]);

  return { disabledVariants };
}

export function useDisabledVariants(
  game: GameUI,
  player: Player,
): Record<PieceVariant, boolean> {
  const remaining = game.actualGame.reserves[player];
  const disabledVariants = useMemo(
    () =>
      Object.fromEntries(
        pieceVariants.map((v) => [
          v,
          (v === 'capstone'
            ? remaining.capstones === 0
            : remaining.pieces === 0) ||
            (game.actualGame.history.length < 2 && v !== 'flat'),
        ]),
      ) as Record<PieceVariant, boolean>,
    [remaining, game.actualGame.history.length],
  );
  return disabledVariants;
}
