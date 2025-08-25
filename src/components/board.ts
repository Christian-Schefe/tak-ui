import type { Updater } from 'use-immer';
import type { Coord, Move, PieceVariant, Player } from '../packages/tak-core';
import type { GameUI } from '../packages/tak-core/ui';

export interface BoardProps {
  game: GameUI;
  setGame: Updater<GameUI>;
  playerInfo: Record<Player, PlayerInfo>;
  mode: BoardMode;
  callbacks: React.RefObject<GameCallbacks>;
  drawProps?: {
    hasDrawOffer: boolean;
    sendDrawOffer: (offer: boolean) => void;
  };
  doResign?: () => void;
}

export interface GameCallbacks {
  onTimeout: () => void;
  onClickTile: (pos: Coord, variant: PieceVariant) => void;
  onMakeMove: (move: Move) => void;
}

export interface PlayerInfo {
  username: string;
  rating: number;
}

export type BoardMode =
  | { type: 'local' }
  | { type: 'remote'; localPlayer: Player }
  | { type: 'spectator' };
