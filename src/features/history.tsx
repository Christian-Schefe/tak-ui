import { useCallback, useMemo } from 'react';
import type { MoveRecord } from '../packages/tak-core';
import type { GameUI } from '../packages/tak-core/ui';
import { isDefined } from './utils';
import type { GameCallbacks } from '../components/board';

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

export function useHistoryNavigation(
  game: GameUI,
  callbacks: React.RefObject<GameCallbacks>,
) {
  const decreasePlyIndex = useCallback(() => {
    const newPlyIndex =
      game.plyIndex !== null
        ? Math.max(0, game.plyIndex - 1)
        : game.actualGame.history.length - 1;
    callbacks.current.goToPly(newPlyIndex);
  }, [game.plyIndex, game.actualGame.history.length, callbacks]);

  const increasePlyIndex = useCallback(() => {
    const newPlyIndex = game.plyIndex !== null ? game.plyIndex + 1 : null;
    callbacks.current.goToPly(newPlyIndex);
  }, [game.plyIndex, callbacks]);

  const goToFirstPly = useCallback(() => {
    callbacks.current.goToPly(0);
  }, [callbacks]);

  const goToLastPly = useCallback(() => {
    callbacks.current.goToPly(null);
  }, [callbacks]);

  const onArrowKey = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target !== null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isTyping) return;

      if (e.key === 'ArrowLeft') {
        decreasePlyIndex();
      } else if (e.key === 'ArrowRight') {
        increasePlyIndex();
      }
    },
    [decreasePlyIndex, increasePlyIndex],
  );

  return {
    decreasePlyIndex,
    increasePlyIndex,
    goToFirstPly,
    goToLastPly,
    onArrowKey,
  };
}
