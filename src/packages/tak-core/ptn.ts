import type { Game, GameSettings, GameState, Player } from '.';
import { logError } from '../../logger';
import { doMove, gameResultToString, newGame } from './game';
import { moveFromString, moveToString } from './move';
import { getDefaultReserve } from './piece';

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

const PTN_ATTRIBUTES_REGEX = /(?:\[(\w*)\s"([^"]*)"\])\s*/g;
const PTN_MOVES_REGEX = /(?!\d*\.)[^\s]+/g;

const PTN_GAME_OVER_REGEX = /^(1\/2-1\/2|0-1|1-0|0-F|F-0|0-R|R-0|0-0)/;
const INTEGER_REGEX = /^\d+$/;

export function PTNToGame(ptn: string): {
  game: Game;
  playerInfo: Record<Player, { username: string; rating?: number }>;
} | null {
  const attributeMatches = Array.from(ptn.matchAll(PTN_ATTRIBUTES_REGEX));
  const attributes: Record<string, string | undefined> = Object.fromEntries(
    attributeMatches.map((match) => {
      const [, name, value] = match;
      return [name, value];
    }),
  );
  const size = attributes.Size;
  const flats = attributes.Flats;
  const caps = attributes.Caps;
  const komi = attributes.Komi;
  const player1 = attributes.Player1 ?? 'Player 1';
  const player2 = attributes.Player2 ?? 'Player 2';
  const rating1 =
    attributes.Rating1 !== undefined ? parseInt(attributes.Rating1) : undefined;
  const rating2 =
    attributes.Rating2 !== undefined ? parseInt(attributes.Rating2) : undefined;
  const playerInfo = {
    white: {
      username: player1,
      rating: rating1 !== undefined && !isNaN(rating1) ? rating1 : undefined,
    },
    black: {
      username: player2,
      rating: rating2 !== undefined && !isNaN(rating2) ? rating2 : undefined,
    },
  };
  if (size === undefined || !INTEGER_REGEX.test(size)) return null;
  const sizeNum = parseInt(size);
  const reserve = getDefaultReserve(sizeNum);
  if (flats !== undefined && INTEGER_REGEX.test(flats))
    reserve.pieces = parseInt(flats);
  if (caps !== undefined && INTEGER_REGEX.test(caps))
    reserve.capstones = parseInt(caps);
  let halfKomi = 0;
  if (komi !== undefined && !Number.isNaN(parseFloat(komi)))
    halfKomi = Math.floor(parseFloat(komi) * 2);

  const restString = ptn.replaceAll(PTN_ATTRIBUTES_REGEX, '').trim();
  const moveMatches = Array.from(restString.matchAll(PTN_MOVES_REGEX));
  const moves = moveMatches.map((match) => match[0]);
  const gameOverStr = moves.find((move) => PTN_GAME_OVER_REGEX.test(move));
  const filteredMoves = moves
    .filter((move) => !PTN_GAME_OVER_REGEX.test(move))
    .map((move) => moveFromString(move.trim()));
  const gameState = gameStateFromStr(gameOverStr ?? '');

  const gameSettings: GameSettings = {
    boardSize: parseInt(size),
    halfKomi,
    reserve,
  };
  const game = newGame(gameSettings);
  for (const move of filteredMoves) {
    try {
      doMove(game, move);
    } catch (error) {
      logError('Error applying move:', move, error);
      return null;
    }
  }
  if (gameState && game.gameState.type === 'ongoing') {
    game.gameState = gameState;
  }
  return { game, playerInfo };
}

function gameStateFromStr(gameOverStr: string): GameState | null {
  switch (gameOverStr) {
    case '1/2-1/2':
      return { type: 'draw', reason: 'mutual agreement' };
    case '0-1':
      return { type: 'win', player: 'black', reason: 'resignation' };
    case '1-0':
      return { type: 'win', player: 'white', reason: 'resignation' };
    case '0-F':
      return { type: 'win', player: 'black', reason: 'flats' };
    case 'F-0':
      return { type: 'win', player: 'white', reason: 'flats' };
    case '0-R':
      return { type: 'win', player: 'black', reason: 'road' };
    case 'R-0':
      return { type: 'win', player: 'white', reason: 'road' };
    default:
      return null;
  }
}
