import { useCallback } from 'react';
import { create } from 'zustand';
import type { GameCallbacks } from '../components/board';

interface GameOfferState {
  hasOfferedDraw: Record<string, boolean | undefined>;
  hasOfferedUndo: Record<string, boolean | undefined>;
  setHasOfferedDraw: (gameId: string, offered: boolean) => void;
  setHasOfferedUndo: (gameId: string, offered: boolean) => void;
  removeGameState: (gameId: string) => void;
}

export const useGameOfferState = create<GameOfferState>((set) => ({
  hasOfferedDraw: {},
  hasOfferedUndo: {},
  setHasOfferedDraw: (gameId: string, offered: boolean) => {
    set((state) => ({
      hasOfferedDraw: {
        ...state.hasOfferedDraw,
        [gameId]: offered,
      },
    }));
  },
  setHasOfferedUndo: (gameId: string, offered: boolean) => {
    set((state) => ({
      hasOfferedUndo: {
        ...state.hasOfferedUndo,
        [gameId]: offered,
      },
    }));
  },
  removeGameState: (gameId: string) => {
    set((state) => {
      const { [gameId]: _, ...drawOfferRest } = state.hasOfferedDraw;
      const { [gameId]: __, ...undoOfferRest } = state.hasOfferedUndo;
      return { hasOfferedDraw: drawOfferRest, hasOfferedUndo: undoOfferRest };
    });
  },
}));

export function useGameOffer(
  gameId: string,
  callbacks: React.RefObject<GameCallbacks>,
) {
  const gameOffers = useGameOfferState();

  const setHasOfferedDraw = useCallback(
    (value: boolean) => {
      gameOffers.setHasOfferedDraw(gameId, value);
      callbacks.current.sendDrawOffer(value);
    },
    [gameOffers, gameId, callbacks],
  );

  const setHasOfferedUndo = useCallback(
    (value: boolean) => {
      gameOffers.setHasOfferedUndo(gameId, value);
      callbacks.current.sendUndoOffer(value);
    },
    [gameOffers, gameId, callbacks],
  );

  const hasOfferedDraw = gameOffers.hasOfferedDraw[gameId] === true;
  const hasOfferedUndo = gameOffers.hasOfferedUndo[gameId] === true;

  return {
    setHasOfferedDraw,
    setHasOfferedUndo,
    hasOfferedDraw,
    hasOfferedUndo,
  };
}
