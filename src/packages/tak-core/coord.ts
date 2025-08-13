import type { Coord, Direction } from '.';

export function offsetCoord(pos: Coord, dir: Direction, amount: number): Coord {
  switch (dir) {
    case 'up':
      return { x: pos.x, y: pos.y + amount };
    case 'down':
      return { x: pos.x, y: pos.y - amount };
    case 'left':
      return { x: pos.x - amount, y: pos.y };
    case 'right':
      return { x: pos.x + amount, y: pos.y };
  }
}

export function newCoord(x: number, y: number): Coord {
  return { x, y };
}

export function coordToString(coord: Coord): string {
  return `${coord.x},${coord.y}`;
}

export function coordEquals(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y;
}

export function dirToString(dir: Direction) {
  switch (dir) {
    case 'up':
      return '+';
    case 'down':
      return '-';
    case 'left':
      return '<';
    case 'right':
      return '>';
  }
}

export function dirFromAdjacent(to: Coord, from: Coord): Direction | null {
  if (to.x === from.x && to.y === from.y + 1) return 'up';
  if (to.x === from.x && to.y === from.y - 1) return 'down';
  if (to.y === from.y && to.x === from.x + 1) return 'right';
  if (to.y === from.y && to.x === from.x - 1) return 'left';
  return null;
}
export function dirFromAligned(to: Coord, from: Coord): Direction | null {
  if (to.x === from.x && to.y > from.y) return 'up';
  if (to.x === from.x && to.y < from.y) return 'down';
  if (to.y === from.y && to.x > from.x) return 'right';
  if (to.y === from.y && to.x < from.x) return 'left';
  return null;
}
