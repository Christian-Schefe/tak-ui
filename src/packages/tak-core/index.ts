export type Player = 'white' | 'black';

export type PieceVariant = 'flat' | 'standing' | 'capstone';

export type Coord = { x: number; y: number };

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameState =
  | { type: 'ongoing' }
  | { type: 'win'; player: Player; reason: 'flats' | 'road' | 'resignation' }
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

export type TrackedPiece = {
  id: number;
  player: Player;
};

export type Stack = {
  variant: PieceVariant;
  composition: TrackedPiece[];
};

export type Board = {
  size: number;
  pieces: (Stack | null)[][];
  _idCounter: number;
};

export type Reserve = {
  pieces: number;
  capstones: number;
};

export type Game = {
  board: Board;
  currentPlayer: Player;
  reserves: Record<Player, Reserve>;
  komi: number;
  gameState: GameState;
  history: MoveRecord[];
};

export type GameSettings = {
  boardSize: number;
  komi: number;
  reserve: Reserve;
};

export function playerOpposite(player: Player): Player {
  return player === 'white' ? 'black' : 'white';
}

export * as ui from './ui';
