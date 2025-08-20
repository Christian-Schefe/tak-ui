import type { Coord, Direction, Game, Move, PieceVariant, Player } from '.';
import { isValidCoord } from './board';
import { coordEquals, dirFromAdjacent, offsetCoord } from './coord';
import { current, isDraft } from 'immer';
import * as game from './game';

export type UIPiece = {
  player: Player;
  variant: PieceVariant;
  pos: Coord;
  height: number;
  isFloating: boolean;
  zPriority: number | null;
};

export type UITile = {
  owner: Player | null;
  highlighted: boolean;
  selectable: boolean;
  hoverable: boolean;
  lastMove: boolean;
};

export type GameUI = {
  actualGame: Game;
  pieces: UIPiece[];
  priorityPieces: number[];
  tiles: UITile[][];
  partialMove: {
    take: number;
    drops: number[];
    pos: Coord;
    dir: Direction | null;
  } | null;
  onMove?: (player: Player, move: Move) => void;
};

export function boardSize(ui: GameUI): number {
  return ui.actualGame.board.size;
}

export function newGameUI(game: Game): GameUI {
  const gameUI: GameUI = {
    actualGame: game,
    pieces: [],
    tiles: [],
    partialMove: null,
    priorityPieces: [],
  };
  onGameUpdate(gameUI);
  return gameUI;
}

export function checkTimeout(ui: GameUI) {
  game.checkTimeout(ui.actualGame, new Date());
  onGameUpdate(ui);
}

export function canDoMove(ui: GameUI, move: Move): boolean {
  const err = game.canDoMove(ui.actualGame, move);
  if (err) {
    return false;
  }
  return true;
}

export function doMove(ui: GameUI, move: Move, triggerMove: boolean) {
  const player = ui.actualGame.currentPlayer;
  game.doMove(ui.actualGame, move);
  ui.partialMove = null;
  ui.priorityPieces = getLastMovePiecesInOrder(ui.actualGame);
  onGameUpdate(ui);
  if (triggerMove) {
    ui.onMove?.(player, move);
  }
}

export function tryPlaceOrAddToPartialMove(
  ui: GameUI,
  pos: Coord,
  variant: PieceVariant,
) {
  const move: Move = {
    type: 'place',
    pos,
    variant,
  };
  if (!ui.partialMove && canDoMove(ui, move)) {
    doMove(ui, move, true);
  } else {
    addToPartialMove(ui, pos);
  }
}

function partialMoveToMove(
  partialMove: GameUI['partialMove'],
): { move: Move; complete: boolean } | null {
  if (partialMove && partialMove.dir) {
    const drops = partialMove.drops;
    const floatingCount =
      partialMove.take - drops.reduce((acc, drop) => acc + drop, 0);

    return {
      move: {
        from: partialMove.pos,
        type: 'move',
        dir: partialMove.dir,
        drops: drops.map((x, i) =>
          i === drops.length - 1 ? x + floatingCount : x,
        ),
      },
      complete: floatingCount === 0,
    };
  }
  return null;
}

export function addToPartialMove(ui: GameUI, pos: Coord) {
  addToPartialMoveHelper(ui, pos);
  const partialMove = partialMoveToMove(ui.partialMove);

  if (partialMove && partialMove.complete) {
    doMove(ui, partialMove.move, true);
    return;
  }
  onGameUpdate(ui);
}

function addToPartialMoveHelper(ui: GameUI, pos: Coord) {
  if (
    ui.actualGame.gameState.type !== 'ongoing' ||
    ui.actualGame.history.length < 2
  ) {
    ui.partialMove = null;
    return;
  }

  if (!ui.partialMove) {
    const stack = ui.actualGame.board.pieces[pos.y][pos.x];
    if (!stack) return;

    if (
      stack.composition[stack.composition.length - 1].player !==
      ui.actualGame.currentPlayer
    ) {
      return;
    }
    ui.partialMove = {
      take: Math.min(stack.composition.length, ui.actualGame.board.size),
      drops: [],
      pos,
      dir: null,
    };
    return;
  }

  const stack =
    ui.actualGame.board.pieces[ui.partialMove.pos.y][ui.partialMove.pos.x];
  if (!stack) {
    ui.partialMove = null;
    return;
  }

  const dropPos = ui.partialMove.dir
    ? offsetCoord(
        ui.partialMove.pos,
        ui.partialMove.dir,
        ui.partialMove.drops.length,
      )
    : ui.partialMove.pos;
  if (coordEquals(dropPos, pos)) {
    if (ui.partialMove.drops.length > 0) {
      ui.partialMove.drops[ui.partialMove.drops.length - 1]++;
    } else {
      ui.partialMove.take--;
      if (ui.partialMove.take <= 0) {
        ui.partialMove = null;
        return;
      }
    }
  } else {
    const dir = dirFromAdjacent(pos, dropPos);
    if (!dir || (ui.partialMove.dir && ui.partialMove.dir !== dir)) {
      ui.partialMove = null;
      return;
    }
    const otherStack = ui.actualGame.board.pieces[pos.y][pos.x];
    if (otherStack && otherStack.variant !== 'flat') {
      const floatingCount =
        ui.partialMove.take -
        ui.partialMove.drops.reduce((acc, drop) => acc + drop, 0);
      if (
        !(
          stack.variant === 'capstone' &&
          otherStack.variant === 'standing' &&
          floatingCount === 1
        )
      ) {
        ui.partialMove = null;
        return;
      }
    }
    ui.partialMove.dir = dir;
    ui.partialMove.drops.push(1);
  }
}

function getLastMovePiecesInOrder(game: Game): number[] {
  if (game.history.length === 0) return [];
  const lastMove = game.history[game.history.length - 1];
  if (lastMove.type === 'place') {
    return (
      game.board.pieces[lastMove.pos.y][lastMove.pos.x]?.composition.map(
        (piece) => piece.id,
      ) ?? []
    );
  } else {
    const pieces = [];
    for (let i = 0; i < lastMove.drops.length; i++) {
      const pos = offsetCoord(lastMove.from, lastMove.dir, i + 1);
      const stack = game.board.pieces[pos.y][pos.x];
      if (stack) {
        pieces.push(
          ...stack.composition
            .slice(-lastMove.drops[i])
            .map((piece) => piece.id),
        );
      }
    }
    return pieces;
  }
}

function onGameUpdate(ui: GameUI) {
  const shownGame = structuredClone(
    isDraft(ui) ? current(ui).actualGame : ui.actualGame,
  );
  const partialMove = partialMoveToMove(ui.partialMove);
  if (partialMove) {
    game.doMove(shownGame, partialMove.move);
    ui.priorityPieces = getLastMovePiecesInOrder(shownGame);
  }

  const floatingData = ui.partialMove && {
    pos: ui.partialMove.dir
      ? offsetCoord(
          ui.partialMove.pos,
          ui.partialMove.dir,
          ui.partialMove.drops.length,
        )
      : ui.partialMove.pos,
    floatingCount:
      ui.partialMove.take -
      ui.partialMove.drops.reduce((acc, drop) => acc + drop, 0),
  };

  const size = ui.actualGame.board.size;

  const clickOptions = [];

  if (ui.partialMove && floatingData) {
    const clickOptionDirs: Direction[] = ui.partialMove.dir
      ? [ui.partialMove.dir]
      : ['left', 'up', 'down', 'right'];
    const dropPos = floatingData.pos;
    const floatingCount = floatingData.floatingCount;
    clickOptions.push(dropPos);
    for (const dir of clickOptionDirs) {
      const newPos = offsetCoord(dropPos, dir, 1);
      if (!isValidCoord(size, newPos)) continue;
      const stack = shownGame.board.pieces[newPos.y][newPos.x];
      if (!stack || stack.variant === 'flat') {
        clickOptions.push(newPos);
      } else if (stack.variant === 'standing' && floatingCount === 1) {
        const thisStack = shownGame.board.pieces[dropPos.y][dropPos.x];
        if (thisStack && thisStack.variant === 'capstone') {
          clickOptions.push(newPos);
        }
      }
    }
  }

  ui.pieces = [];
  ui.tiles = [];

  const isOngoing = ui.actualGame.gameState.type === 'ongoing';
  for (let y = 0; y < size; y++) {
    ui.tiles[y] = [];
    for (let x = 0; x < size; x++) {
      const stack = shownGame.board.pieces[y][x];
      const pos = { x, y };
      const selectable = clickOptions.some((coord) => coordEquals(coord, pos));
      let hoverable = ui.partialMove === null;
      if (stack) {
        const floatingHeightThreshold =
          floatingData && coordEquals(pos, floatingData.pos)
            ? stack.composition.length - floatingData.floatingCount
            : null;
        for (let height = 0; height < stack.composition.length; height++) {
          const priority_index = ui.priorityPieces.findIndex(
            (id) => id === stack.composition[height].id,
          );
          ui.pieces[stack.composition[height].id] = {
            zPriority: priority_index >= 0 ? priority_index : null,
            player: stack.composition[height].player,
            variant:
              height === stack.composition.length - 1 ? stack.variant : 'flat',
            pos,
            height,
            isFloating:
              floatingHeightThreshold !== null &&
              height >= floatingHeightThreshold,
          };
        }
        hoverable &&=
          ui.actualGame.history.length >= 2 &&
          stack.composition[stack.composition.length - 1].player ===
            ui.actualGame.currentPlayer;
      }

      ui.tiles[y][x] = {
        owner: stack?.composition[0].player ?? null,
        highlighted: false,
        selectable: isOngoing && selectable,
        hoverable: isOngoing && (hoverable || selectable),
        lastMove: false,
      };
    }
  }

  if (ui.actualGame.history.length >= 1) {
    const lastMove = ui.actualGame.history[ui.actualGame.history.length - 1];
    if (lastMove.type === 'place') {
      ui.tiles[lastMove.pos.y][lastMove.pos.x].lastMove = true;
    } else {
      for (let i = 0; i <= lastMove.drops.length; i++) {
        const pos = offsetCoord(lastMove.from, lastMove.dir, i);
        ui.tiles[pos.y][pos.x].lastMove = true;
      }
    }
  }
}
