import { create } from 'zustand';
interface GameOfferState {
  hasOfferedDraw: Record<string, boolean | undefined>;
  hasOfferedUndo: Record<string, boolean | undefined>;
  setHasOfferedDraw: (gameId: string, offered: boolean) => void;
  setHasOfferedUndo: (gameId: string, offered: boolean) => void;
  removeGameState: (gameId: string) => void;
}

export const useGameOffer = create<GameOfferState>((set) => ({
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
      const { [gameId]: _, ...drawOfferrest } = state.hasOfferedDraw;
      const { [gameId]: __, ...undoOfferrest } = state.hasOfferedUndo;
      return { hasOfferedDraw: drawOfferrest, hasOfferedUndo: undoOfferrest };
    });
  },
}));
