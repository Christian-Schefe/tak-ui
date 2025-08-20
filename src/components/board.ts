import type { Updater } from 'use-immer';
import type { Player } from '../packages/tak-core';
import type { GameUI } from '../packages/tak-core/ui';

export interface BoardProps {
  game: GameUI;
  setGame: Updater<GameUI>;
  interactive: boolean;
  playerInfo: Record<Player, PlayerInfo>;
}

export interface PlayerInfo {
  username: string;
  rating: number;
}
