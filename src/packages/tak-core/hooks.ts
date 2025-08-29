import { useMemo } from 'react';
import type { GameUI } from './ui';
import type { PieceId } from '.';

export function usePieceIds(game: GameUI) {
  return useMemo(() => {
    const pieceIds = Object.keys(game.pieces) as PieceId[];
    pieceIds.sort((a, b) => a.localeCompare(b));
    return pieceIds;
  }, [game.pieces]);
}

export function usePieceIdsWithReserve(game: GameUI) {
  return useMemo(() => {
    const pieceIds: PieceId[] = [];
    for (let i = 0; i < game.actualGame.settings.reserve.pieces; i++) {
      pieceIds.push(`W/P/${i.toString()}`);
      pieceIds.push(`B/P/${i.toString()}`);
    }
    for (let i = 0; i < game.actualGame.settings.reserve.capstones; i++) {
      pieceIds.push(`W/C/${i.toString()}`);
      pieceIds.push(`B/C/${i.toString()}`);
    }

    pieceIds.sort((a, b) => a.localeCompare(b));
    return pieceIds;
  }, [game.actualGame.settings.reserve]);
}
