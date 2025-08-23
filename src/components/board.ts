import type { Updater } from 'use-immer';
import type { Coord, PieceVariant, Player } from '../packages/tak-core';
import type { GameUI } from '../packages/tak-core/ui';

export interface BoardProps {
  game: GameUI;
  setGame: Updater<GameUI>;
  playerInfo: Record<Player, PlayerInfo>;
  mode: BoardMode;
  onClickTile: (pos: Coord, variant: PieceVariant) => void;
  drawProps?: {
    hasDrawOffer: boolean;
    sendDrawOffer: (offer: boolean) => void;
  };
}

export interface PlayerInfo {
  username: string;
  rating: number;
}

export type BoardMode =
  | { type: 'local' }
  | { type: 'remote'; localPlayer: Player }
  | { type: 'spectator' };
