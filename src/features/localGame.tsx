import { create } from 'zustand';
import { newGameUI, type GameUI } from '../packages/tak-core/ui';
import { newGame } from '../packages/tak-core/game';
import { getDefaultReserve } from '../packages/tak-core/piece';
import { produce } from 'immer';
import type { GameSettings } from '../packages/tak-core';

interface LocalGameState {
  game: GameUI;
}

export const useLocalGameState = create<LocalGameState>()(() => ({
  game: newGameUI(
    newGame({ boardSize: 5, halfKomi: 0, reserve: getDefaultReserve(5) }),
  ),
}));

export function modifyLocalGame(
  recipe: ((game: GameUI) => void) | ((game: GameUI) => GameUI),
) {
  useLocalGameState.setState((state) => ({
    game: produce(state.game, recipe),
  }));
}

export function newLocalGame(settings: GameSettings) {
  useLocalGameState.setState(() => ({
    game: newGameUI(newGame(settings)),
  }));
}

export function rematchLocalGame() {
  useLocalGameState.setState((state) => ({
    game: newGameUI(newGame(state.game.actualGame.settings)),
  }));
}
