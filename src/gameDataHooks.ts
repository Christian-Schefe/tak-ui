import { createContext, use } from 'react';
import type { GameDataState } from './gameData';

export const GameDataContext = createContext<GameDataState | undefined>(
  undefined,
);

export function useGameData() {
  const context = use(GameDataContext);
  if (context === undefined) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
}
