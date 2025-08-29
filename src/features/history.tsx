import { useMemo } from 'react';
import type { MoveRecord } from '../packages/tak-core';
import type { GameUI } from '../packages/tak-core/ui';
import { isDefined } from './utils';

export interface HistoryEntry {
  white?: MoveRecord;
  black?: MoveRecord;
}

export function useGameHistory(game: GameUI) {
  return useMemo(() => {
    const perChunk = 2;

    const result = game.actualGame.history.reduce<HistoryEntry[]>(
      (resultArray, item, index) => {
        const chunkIndex = Math.floor(index / perChunk);

        resultArray[chunkIndex] ??= {};
        if (resultArray[chunkIndex].white === undefined) {
          resultArray[chunkIndex].white = item;
        } else {
          resultArray[chunkIndex].black = item;
        }

        return resultArray;
      },
      [],
    );

    if (result.length === 0) {
      result.push({});
    }

    return result.filter(isDefined);
  }, [game.actualGame.history]);
}
