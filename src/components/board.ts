import type { Coord, Move, PieceVariant, Player } from '../packages/tak-core';
import type { GameUI } from '../packages/tak-core/ui';

export interface BoardProps {
  game: GameUI;
  playerInfo: Record<Player, PlayerInfo>;
  mode: BoardMode;
  callbacks: React.RefObject<GameCallbacks>;
  hasDrawOffer?: boolean;
  hasUndoOffer?: boolean;
}

export interface GameCallbacks {
  onTimeout: () => void;
  onClickTile: (pos: Coord, variant: PieceVariant) => void;
  onMakeMove: (move: Move) => void;
  goToPly: (index: number) => void;
  sendDrawOffer: (offer: boolean) => void;
  sendUndoOffer: (offer: boolean) => void;
  doResign: () => void;
}

export interface PlayerInfo {
  username: string;
  rating: number;
}

export type BoardMode =
  | { type: 'local'; review: boolean }
  | { type: 'remote'; localPlayer: Player; gameId: string }
  | { type: 'spectator'; gameId: string };
