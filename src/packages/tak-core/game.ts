import {
  playerOpposite,
  type Game,
  type GameSettings,
  type Move,
  type MoveRecord,
  type Player,
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
    settings,
    currentPlayer: 'white',
    history: [],
    reserves: {
      white: structuredClone(settings.reserve),
      black: structuredClone(settings.reserve),
    },
    gameState: { type: 'ongoing' },
    clock: settings.clock && {
      lastMove: null,
      increment: settings.clock.increment,
      remaining: {
        white: settings.clock.contingent,
        black: settings.clock.contingent,
      },
    },
  };
}

export function canDoMove(game: Game, move: Move, now?: Date): string | null {
  now ??= new Date();
  checkTimeout(game, now);

  if (game.gameState.type !== 'ongoing')
    return `Game is not ongoing: ${game.gameState.type}`;

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

export function isClockActive(game: Game, player: Player): boolean {
  return (
    game.gameState.type === 'ongoing' &&
    game.currentPlayer === player &&
    !!game.clock?.lastMove
  );
}

export function gameFromPlyCount(game: Game, plyCount: number): Game {
  const resultGame = newGame({ ...game.settings, clock: undefined });
  const history = game.history.slice(0, plyCount);
  for (const move of history) {
    doMove(resultGame, move);
  }
  return resultGame;
}

export function getTimeRemaining(
  game: Game,
  player: Player,
  now?: Date,
): number | null {
  if (game.clock) {
    return Math.max(
      0,
      game.clock.remaining[player] -
        (now &&
        game.gameState.type === 'ongoing' &&
        game.currentPlayer === player &&
        game.clock.lastMove
          ? now.getTime() - game.clock.lastMove.getTime()
          : 0),
    );
  }
  return null;
}

export function setTimeRemaining(
  game: Game,
  remaining: Record<Player, number>,
  now: Date,
) {
  if (game.clock) {
    game.clock.remaining.white = remaining.white;
    game.clock.remaining.black = remaining.black;
    game.clock.lastMove = now;
    checkTimeout(game, now);
  }
}

function applyTimeToClock(game: Game, now: Date) {
  const remaining = getTimeRemaining(game, game.currentPlayer, now);
  if (game.clock && remaining !== null) {
    game.clock.remaining[game.currentPlayer] = remaining;
    game.clock.lastMove = now;
  }
}

export function checkTimeout(game: Game, now: Date): number | null {
  if (game.gameState.type !== 'ongoing') return null;

  applyTimeToClock(game, now);

  const player = game.currentPlayer;
  const timeRemaining = getTimeRemaining(game, player, now);
  if (timeRemaining !== null && timeRemaining <= 0) {
    game.gameState = {
      type: 'win',
      player: playerOpposite(player),
      reason: 'timeout',
    };
  }
  return timeRemaining ?? null;
}

export function doMove(game: Game, move: Move, now?: Date) {
  now ??= new Date();
  const timeRemaining = checkTimeout(game, now);
  const err = canDoMove(game, move, now);
  if (err) {
    throw new Error(`Invalid move: ${err}`);
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

  if (game.clock && timeRemaining) {
    game.clock.remaining[game.currentPlayer] =
      timeRemaining + game.clock.increment;
    game.clock.lastMove = now;
  }

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
    const blackScore = flatCounts.black + game.settings.komi;
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
