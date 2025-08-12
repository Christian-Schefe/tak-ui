import type { Direction, Move, PieceVariant } from '.';

export function moveFromString(str: string): Move {
  function stringToVariant(variant: string): PieceVariant {
    switch (variant) {
      case 'S':
        return 'standing';
      case 'C':
        return 'capstone';
      case 'F':
        return 'flat';
      default:
        throw new Error(`Invalid piece variant: ${variant}`);
    }
  }
  function stringToDir(dir: string): Direction {
    switch (dir) {
      case '>':
        return 'right';
      case '<':
        return 'left';
      case '+':
        return 'up';
      case '-':
        return 'down';
      default:
        throw new Error(`Invalid direction: ${dir}`);
    }
  }

  const moveRegex = /^([1-9]?)([a-z])([1-9])([<>+-])([1-9]*)/;
  const moveMatch = str.match(moveRegex);
  if (moveMatch) {
    const take = moveMatch[1]
      ? moveMatch[1].charCodeAt(0) - '0'.charCodeAt(0)
      : 1;
    const x = moveMatch[2].charCodeAt(0) - 'a'.charCodeAt(0);
    const y = moveMatch[3].charCodeAt(0) - '1'.charCodeAt(0);
    const dir = stringToDir(moveMatch[4]);
    const drops = moveMatch[5]
      ? moveMatch[5].split('').map((d) => d.charCodeAt(0) - '0'.charCodeAt(0))
      : [take];
    return { type: 'move', from: { x, y }, dir, drops };
  }

  const placeRegex = /^([FSC]?)([a-z])([1-9])/;
  const placeMatch = str.match(placeRegex);
  if (placeMatch) {
    const variant = stringToVariant(placeMatch[1] || 'F');
    const x = placeMatch[2].charCodeAt(0) - 'a'.charCodeAt(0);
    const y = placeMatch[3].charCodeAt(0) - '1'.charCodeAt(0);
    return { type: 'place', variant, pos: { x, y } };
  }

  throw new Error(`Invalid move string: ${str}`);
}
