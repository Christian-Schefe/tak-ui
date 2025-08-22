import type { Updater } from 'use-immer';
import type { Coord, PieceVariant, Player } from '../packages/tak-core';
import type { GameUI } from '../packages/tak-core/ui';

export interface BoardProps {
  game: GameUI;
  setGame: Updater<GameUI>;
  interactive: boolean;
  playerInfo: Record<Player, PlayerInfo>;
  localPlayer?: Player;
  onClickTile: (pos: Coord, variant: PieceVariant) => void;
}

export interface PlayerInfo {
  username: string;
  rating: number;
}
