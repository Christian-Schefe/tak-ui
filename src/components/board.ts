import type { Move, Player } from '../packages/tak-core';
import type { GameUI } from '../packages/tak-core/ui';

export type BoardProps = {
  game: GameUI;
  interactive: boolean;
  playerInfo: Record<Player, PlayerInfo>;
  onMove?: (player: Player, move: Move) => void;
};

export type PlayerInfo = {
  username: string;
  rating: number;
};
