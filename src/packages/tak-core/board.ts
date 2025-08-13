import type {
  Board,
  Coord,
  Direction,
  MoveRecord,
  PieceVariant,
  Player,
  Stack,
} from '.';
import { coordEquals, coordToString, newCoord, offsetCoord } from './coord';

export function isValidCoord(size: number, pos: Coord): boolean {
  return pos.x >= 0 && pos.x < size && pos.y >= 0 && pos.y < size;
}

export function newBoard(size: number): Board {
  return {
    size,
    pieces: Array.from({ length: size }, () => Array(size).fill(null)),
    _idCounter: 0,
  };
}

export function canPlacePiece(board: Board, pos: Coord): string | null {
  if (!isValidCoord(board.size, pos))
    return 'Invalid place position: ' + coordToString(pos);

  const stack = board.pieces[pos.y][pos.x];
  return !stack ? null : 'Position is already occupied';
}

export function placePiece(
  board: Board,
  pos: Coord,
  player: Player,
  variant: PieceVariant,
): MoveRecord {
  const err = canPlacePiece(board, pos);
  if (err) {
    throw new Error('Cannot place: ' + err);
  }

  const trackedPiece = {
    id: board._idCounter,
    player,
  };

  board._idCounter++;

  const stack: Stack = {
    variant,
    composition: [trackedPiece],
  };

  board.pieces[pos.y][pos.x] = stack;

  return {
    type: 'place',
    pos,
    variant,
  };
}

export function canMovePiece(
  board: Board,
  from: Coord,
  dir: Direction,
  drops: number[],
  player: Player,
): string | null {
  if (!isValidCoord(board.size, from))
    return 'Invalid move start position: ' + coordToString(from);
  const to = offsetCoord(from, dir, drops.length);
  if (!isValidCoord(board.size, to))
    return 'Invalid move end position: ' + coordToString(to);
  const take = drops.reduce((acc, drop) => acc + drop, 0);
  if (drops.length == 0 || take == 0) return 'Invalid move';

  const stack = board.pieces[from.y][from.x];
  if (!stack || stack.composition.length < take)
    return 'Not enough pieces to move';
  if (stack.composition[stack.composition.length - 1].player !== player)
    return 'Not your piece';
  const variant = stack.variant;

  for (let i = 0; i < drops.length; i++) {
    const pos = offsetCoord(from, dir, i + 1);
    const stack = board.pieces[pos.y][pos.x];
    const canSmash = variant === 'capstone' && i === take - 1 && drops[i] === 1;
    if (stack && stack.variant === 'capstone')
      return 'Cannot move onto capstone';
    if (stack && stack.variant === 'standing' && !canSmash)
      return 'Cannot move onto standing piece';
  }
  return null;
}

export function movePiece(
  board: Board,
  from: Coord,
  dir: Direction,
  drops: number[],
  player: Player,
): MoveRecord {
  const err = canMovePiece(board, from, dir, drops, player);
  if (err) {
    throw new Error('Cannot move: ' + err);
  }
  const take = drops.reduce((acc, drop) => acc + drop, 0);

  const stack = board.pieces[from.y][from.x]!;
  const takenPieces = stack.composition.splice(-take);
  const variant = stack.variant;
  stack.variant = 'flat';

  if (stack.composition.length === 0) {
    board.pieces[from.y][from.x] = null;
  }

  let smash = false;

  for (let i = 0; i < drops.length; i++) {
    const pos = offsetCoord(from, dir, i + 1);
    const stack = board.pieces[pos.y][pos.x];
    const piecesToAdd = takenPieces.splice(0, drops[i]);
    const thisVariant = i === drops.length - 1 ? variant : 'flat';
    if (!stack) {
      board.pieces[pos.y][pos.x] = {
        variant: thisVariant,
        composition: piecesToAdd,
      };
    } else {
      if (stack.variant === 'standing') {
        smash = true;
      }
      stack.variant = thisVariant;
      stack.composition.push(...piecesToAdd);
    }
  }

  return {
    type: 'move',
    from,
    dir,
    drops,
    smash,
  };
}

export function findRoads(board: Board, player: Player): Coord[] | null {
  function getOffsetList(pos: Coord, dir: Direction, amount: number): Coord[] {
    const offsets: Coord[] = [pos];
    for (let i = 1; i < amount; i++) {
      offsets.push(offsetCoord(pos, dir, i));
    }
    return offsets;
  }

  function findRoadsHelper(starts: Coord[], ends: Coord[]): Coord[] | null {
    const visited = new Set<string>();
    const prev = new Map<string, Coord | null>();
    const queue: Coord[] = [];
    for (const start of starts) {
      const stack = board.pieces[start.y][start.x];
      if (
        stack &&
        stack.composition.length > 0 &&
        stack.composition[stack.composition.length - 1].player === player &&
        stack.variant !== 'standing'
      ) {
        const key = coordToString(start);
        visited.add(key);
        prev.set(key, null);
        queue.push(start);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (ends.some((e) => coordEquals(e, current))) {
        const path: Coord[] = [];
        let node: Coord | null = current;
        while (node) {
          path.push(node);
          node = prev.get(coordToString(node)) ?? null;
        }
        path.reverse();
        return path;
      }

      const neighbors: Coord[] = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ];

      for (const neighbor of neighbors) {
        const key = coordToString(neighbor);
        if (isValidCoord(board.size, neighbor) && !visited.has(key)) {
          const stack = board.pieces[neighbor.y][neighbor.x];
          if (
            stack &&
            stack.composition.length > 0 &&
            stack.composition[stack.composition.length - 1].player === player &&
            stack.variant !== 'standing'
          ) {
            visited.add(key);
            prev.set(key, current);
            queue.push(neighbor);
          }
        }
      }
    }
    return null;
  }
  const horizontalRoad = findRoadsHelper(
    getOffsetList(newCoord(0, 0), 'up', board.size),
    getOffsetList(newCoord(board.size - 1, 0), 'up', board.size),
  );
  if (horizontalRoad) return horizontalRoad;
  return findRoadsHelper(
    getOffsetList(newCoord(0, 0), 'right', board.size),
    getOffsetList(newCoord(0, board.size - 1), 'right', board.size),
  );
}

export function isFilled(board: Board): boolean {
  for (const row of board.pieces) {
    for (const stack of row) {
      if (!stack) {
        return false;
      }
    }
  }
  return true;
}

export function countFlats(board: Board): Record<Player, number> {
  const counts: Record<Player, number> = { white: 0, black: 0 };
  for (const row of board.pieces) {
    for (const stack of row) {
      if (stack && stack.variant === 'flat') {
        const player = stack.composition[stack.composition.length - 1].player;
        counts[player]++;
      }
    }
  }
  return counts;
}

export function toPositionString(board: Board) {
  function variantToString(variant: PieceVariant) {
    switch (variant) {
      case 'flat':
        return '';
      case 'standing':
        return 'S';
      case 'capstone':
        return 'C';
    }
  }

  function rowToPositionString(row: (Stack | null)[]) {
    const result: string[] = [];
    let emptyCount = 0;

    for (const stack of row) {
      if (stack === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          result.push(`x${emptyCount === 1 ? '' : emptyCount}`);
          emptyCount = 0;
        }
        result.push(
          `${stack.composition
            .map((piece) => (piece.player == 'white' ? '1' : '2'))
            .join('')}${variantToString(stack.variant)}`,
        );
      }
    }

    if (emptyCount > 0) {
      result.push(`x${emptyCount === 1 ? '' : emptyCount}`);
    }

    return result.join(',');
  }
  return board.pieces.map(rowToPositionString).reverse().join('\n');
}
