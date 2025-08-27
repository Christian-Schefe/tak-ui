import type { Game, Player } from '.';
import { gameResultToString } from './game';
import { moveToString } from './move';

export function gameToPTN(game: Game, usernames: Record<Player, string>) {
  const attributes = [
    { name: 'Size', value: game.board.size.toString() },
    { name: 'Player1', value: usernames.white },
    { name: 'Player2', value: usernames.black },
    { name: 'Komi', value: (game.settings.halfKomi / 2).toString() },
    { name: 'Flats', value: game.settings.reserve.pieces.toString() },
    { name: 'Caps', value: game.settings.reserve.capstones.toString() },
    { name: 'Result', value: gameResultToString(game.gameState) ?? '' },
  ];

  const moves = game.history.map((move) => moveToString(move));

  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push(moves[i] + (moves[i + 1] ? ` ${moves[i + 1]}` : ''));
  }
  const moveStr = movePairs
    .map((pair, index) => `${(index + 1).toString()}. ${pair}`)
    .join('\n');

  return `${attributes.map((attr) => `[${attr.name} "${attr.value}"]`).join('\n')}\n${moveStr}`;
}
