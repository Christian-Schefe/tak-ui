import {
  playerOpposite,
  type Game,
  type GameSettings,
  type Move,
  type MoveRecord,
} from '.';
import {
  canMovePiece,
  canPlacePiece,
  countFlats,
  findRoads,
  isFilled,
  movePiece,
  newBoard,
  placePiece,
} from './board';

export function newGame(settings: GameSettings): Game {
  const board = newBoard(settings.boardSize);
  return {
    board,
    komi: settings.komi,
    currentPlayer: 'white',
    history: [],
    reserves: {
      white: structuredClone(settings.reserve),
      black: structuredClone(settings.reserve),
    },
    gameState: { type: 'ongoing' },
  };
}

export function canDoMove(game: Game, move: Move): string | null {
  if (game.gameState.type !== 'ongoing') return 'Game is not ongoing';

  if (move.type === 'place') {
    if (game.history.length < 2 && move.variant !== 'flat') {
      return 'Invalid place move';
    }
    const reserve = game.reserves[game.currentPlayer];
    const reserveNumber =
      move.variant === 'capstone' ? reserve.capstones : reserve.pieces;
    if (reserveNumber <= 0) {
      return 'Not enough pieces in reserve';
    }
    return canPlacePiece(game.board, move.pos);
  } else {
    if (game.history.length < 2) {
      return 'Cannot move piece';
    }
    return canMovePiece(
      game.board,
      move.from,
      move.dir,
      move.drops,
      game.currentPlayer,
    );
  }
}

function isReserveEmpty(game: Game) {
  return (
    (game.reserves.white.pieces === 0 && game.reserves.white.capstones === 0) ||
    (game.reserves.black.pieces === 0 && game.reserves.black.capstones === 0)
  );
}

export function doMove(game: Game, move: Move) {
  const err = canDoMove(game, move);
  if (err) {
    throw new Error('Invalid move: ' + err);
  }

  const player = game.currentPlayer;

  let record: MoveRecord;
  if (move.type === 'place') {
    const placingPlayer =
      game.history.length < 2 ? playerOpposite(player) : player;

    record = placePiece(game.board, move.pos, placingPlayer, move.variant);

    const reserve = game.reserves[game.currentPlayer];
    if (move.variant === 'capstone') {
      reserve.capstones--;
    } else {
      reserve.pieces--;
    }
  } else {
    record = movePiece(
      game.board,
      move.from,
      move.dir,
      move.drops,
      game.currentPlayer,
    );
  }

  game.history.push(record);
  game.currentPlayer = playerOpposite(player);

  const road =
    findRoads(game.board, player) ??
    findRoads(game.board, playerOpposite(player));
  if (road) {
    game.gameState = {
      type: 'win',
      player,
      reason: 'road',
    };
    console.log('Road: ', road);
  } else if (isReserveEmpty(game) || isFilled(game.board)) {
    const flatCounts = countFlats(game.board);
    const whiteScore = flatCounts.white;
    const blackScore = flatCounts.black + game.komi;
    if (whiteScore !== blackScore) {
      game.gameState = {
        type: 'win',
        player: whiteScore > blackScore ? 'white' : 'black',
        reason: 'flats',
      };
    } else {
      game.gameState = {
        type: 'draw',
        reason: 'flats',
      };
    }
  }
}
