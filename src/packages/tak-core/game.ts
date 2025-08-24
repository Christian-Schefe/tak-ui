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
      white: { ...settings.reserve },
      black: { ...settings.reserve },
    },
    gameState: { type: 'ongoing' },
    clock: settings.clock && {
      lastMove: null,
      remainingMs: {
        white: settings.clock.contingentMs,
        black: settings.clock.contingentMs,
      },
    },
  };
}

export function canDoMove(game: Game, move: Move, now?: Date): string | null {
  now ??= new Date();
  if (isTimeout(game, now)) {
    return 'Game is over: timeout';
  }

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
      game.clock.remainingMs[player] -
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
    game.clock.remainingMs.white = remaining.white;
    game.clock.remainingMs.black = remaining.black;
    game.clock.lastMove = now;
    checkTimeout(game, now);
  }
}

function applyTimeToClock(game: Game, now: Date) {
  const remaining = getTimeRemaining(game, game.currentPlayer, now);
  if (game.clock && remaining !== null) {
    game.clock.remainingMs[game.currentPlayer] = remaining;
    game.clock.lastMove = now;
  }
}

export function isTimeout(game: Game, now: Date): boolean {
  if (game.gameState.type !== 'ongoing') return false;

  const player = game.currentPlayer;
  const timeRemaining = getTimeRemaining(game, player, now);
  return timeRemaining !== null && timeRemaining <= 0;
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

  if (game.clock && game.settings.clock && timeRemaining) {
    const move = Math.floor(game.history.length / 2) + 1;
    const extraGain =
      game.settings.clock.extra && move === game.settings.clock.extra.move
        ? game.settings.clock.extra.amountMs
        : 0;
    if (extraGain) {
      console.log(
        'gained',
        extraGain,
        timeRemaining,
        extraGain + timeRemaining,
      );
    }
    game.clock.remainingMs[game.currentPlayer] =
      timeRemaining + game.settings.clock.incrementMs + extraGain;
    game.clock.lastMove = now;
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
      road,
    };
    console.log('Road: ', road);
  } else if (isReserveEmpty(game) || isFilled(game.board)) {
    const flatCounts = countFlats(game.board);
    const whiteScore = flatCounts.white * 2;
    const blackScore = flatCounts.black * 2 + game.settings.halfKomi;
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
