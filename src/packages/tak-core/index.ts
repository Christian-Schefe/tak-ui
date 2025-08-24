export type Player = 'white' | 'black';

export type PieceVariant = 'flat' | 'standing' | 'capstone';

export interface Coord {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameState =
  | { type: 'ongoing' }
  | {
      type: 'win';
      player: Player;
      reason: 'flats' | 'resignation' | 'timeout';
    }
  | {
      type: 'win';
      player: Player;
      reason: 'road';
      road?: Coord[];
    }
  | { type: 'draw'; reason: 'flats' | 'mutual agreement' };

export type Move =
  | { type: 'place'; pos: Coord; variant: PieceVariant }
  | {
      type: 'move';
      from: Coord;
      dir: Direction;
      drops: number[];
    };

export type MoveRecord =
  | { type: 'place'; pos: Coord; variant: PieceVariant }
  | {
      type: 'move';
      from: Coord;
      dir: Direction;
      drops: number[];
      smash: boolean;
    };

export interface TrackedPiece {
  id: number;
  player: Player;
}

export interface Stack {
  variant: PieceVariant;
  composition: TrackedPiece[];
}

export interface Board {
  size: number;
  pieces: (Stack | null)[][];
  _idCounter: number;
}

export interface Reserve {
  pieces: number;
  capstones: number;
}

export interface Clock {
  lastMove: Date | null;
  remainingMs: Record<Player, number>;
}

export interface Game {
  settings: GameSettings;
  board: Board;
  currentPlayer: Player;
  reserves: Record<Player, Reserve>;
  gameState: GameState;
  history: MoveRecord[];
  clock?: Clock;
}

export interface GameSettings {
  boardSize: number;
  halfKomi: number;
  reserve: Reserve;
  clock?: {
    contingentMs: number;
    incrementMs: number;
    extra?: {
      move: number;
      amountMs: number;
    };
  };
}

export function playerOpposite(player: Player): Player {
  return player === 'white' ? 'black' : 'white';
}

export * as ui from './ui';
