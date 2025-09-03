import { create } from 'zustand';
import { newGameUI, type GameUI } from '../packages/tak-core/ui';
import { useWSListener } from '../authHooks';
import { useCallback, useMemo } from 'react';
import type { TextMessage } from '../auth';
import {
  ui,
  type GameSettings,
  type GameState,
  type Move,
  type PieceVariant,
} from '../packages/tak-core';
import type { TimeMessage } from '../gameData';
import { produce } from 'immer';
import { useGameListState, type GameListEntry } from './gameList';
import { newGame, setTimeRemaining } from '../packages/tak-core/game';
import { dirFromAligned } from '../packages/tak-core/coord';
import { useGameOfferState } from './gameOffers';
import { router } from '../router';

interface RemoteGameState {
  games: Record<string, GameStateEntry | undefined>;
}

interface GameStateEntry {
  game: GameUI;
  drawOffer: boolean;
  undoOffer: boolean;
}

export const useRemoteGameState = create<RemoteGameState>()(() => ({
  games: {},
  unprocessedMessages: {},
}));

export function useUpdateRemoteGames() {
  const gameEntries = useGameListState((state) => state.games);
  const gameOffers = useGameOfferState();

  const handleMessage = useCallback(
    (msg: TextMessage) => {
      const text = msg.text;
      console.log('handling', text);
      if (text.startsWith('Game#')) {
        const id = parseGameUpdateMessage(text);
        if (id === null) {
          console.log('no id for game message', text);
          return;
        }

        const timeMessage = parseGameTimeMessage(text);
        if (timeMessage) {
          useRemoteGameState.setState((state) =>
            produce(state, (draft) => {
              if (!draft.games[id]) return;
              setTimeRemaining(
                draft.games[id].game.actualGame,
                timeMessage,
                timeMessage.timestamp,
              );
            }),
          );
        }

        const drawOffer = parseGameDrawMessage(text);
        if (drawOffer !== null) {
          useRemoteGameState.setState((state) =>
            produce(state, (draft) => {
              if (!draft.games[id]) return;
              draft.games[id].drawOffer = drawOffer;
            }),
          );
        }

        const undoOffer = parseGameUndoOfferMessage(text);
        if (undoOffer !== null) {
          useRemoteGameState.setState((state) =>
            produce(state, (draft) => {
              if (!draft.games[id]) return;
              draft.games[id].undoOffer = undoOffer;
            }),
          );
        }

        const gameOver = parseGameOverPattern(text);
        if (gameOver !== null) {
          useRemoteGameState.setState((state) =>
            produce(state, (draft) => {
              if (!draft.games[id]) return;
              if (
                draft.games[id].game.actualGame.gameState.type !== gameOver.type
              ) {
                draft.games[id].game.actualGame.gameState = gameOver;
                ui.onGameUpdate(draft.games[id].game);
              }
            }),
          );
        }

        const isUndo = isGameUndoMessage(text);
        if (isUndo) {
          useRemoteGameState.setState((state) =>
            produce(state, (draft) => {
              if (!draft.games[id]) return;
              ui.undoMove(draft.games[id].game);
              draft.games[id].undoOffer = false;
            }),
          );
        }

        const placeMatch = placeRegex.exec(text);
        if (placeMatch) {
          const move = parsePlaceMove(placeMatch);
          useRemoteGameState.setState((state) =>
            produce(state, (draft) => {
              if (!draft.games[id]) return;
              ui.doMove(draft.games[id].game, move);
            }),
          );
        }
        const moveMatch = moveRegex.exec(text);
        if (moveMatch) {
          const move = parseMoveMove(moveMatch);
          useRemoteGameState.setState((state) =>
            produce(state, (draft) => {
              if (!draft.games[id]) return;
              ui.doMove(draft.games[id].game, move);
            }),
          );
        }

        if (isUndo) {
          gameOffers.setHasOfferedUndo(id, false);
        }
        if (gameOver) {
          gameOffers.removeGameState(id);
          gameOffers.setHasOfferedUndo(id, false);
          gameOffers.setHasOfferedDraw(id, false);
        }
      } else if (text.startsWith('Observe')) {
        const id = parseObserveMessage(text);
        if (id !== null) {
          console.log('Received observe message for game:', id);
          useRemoteGameState.setState((state) => {
            if (!gameEntries[id]) return state;
            return {
              games: {
                ...state.games,
                [id]: {
                  game: newGameUI(
                    newGame(settingsFromGameEntry(gameEntries[id])),
                  ),
                  drawOffer: false,
                  undoOffer: false,
                },
              },
            };
          });
        } else {
          console.error('Failed to parse observe game message:', text);
        }
      } else if (text.startsWith('Game Start')) {
        const startGameSettings = parseGameStartMessage(text);
        if (startGameSettings) {
          console.log(
            'Received game start message for game:',
            startGameSettings.id,
            startGameSettings.settings,
          );
          useRemoteGameState.setState((state) =>
            produce(state, (draft) => {
              draft.games[startGameSettings.id] = {
                game: newGameUI(newGame(startGameSettings.settings)),
                drawOffer: false,
                undoOffer: false,
              };
            }),
          );
          void router.navigate({ to: '/play' });
        } else {
          console.error('Failed to parse game start message:', text);
        }
      }
    },
    [gameEntries, gameOffers],
  );

  const onMessage = useCallback(
    (msgs: TextMessage[]) => {
      for (const msg of msgs) {
        handleMessage(msg);
      }
    },
    [handleMessage],
  );

  const batchedOnMessage = useMemo(() => batch(onMessage), [onMessage]);

  const onOpen = useCallback(() => {
    useRemoteGameState.setState(() => ({
      games: {},
    }));
  }, []);

  useWSListener('update-remote-games', { onMessage: batchedOnMessage, onOpen });
}

export function useRemoteGame(gameId: string) {
  const games = useRemoteGameState((state) => state.games);
  return games[gameId];
}

export function modifyRemoteGame(
  gameId: string,
  recipe: ((game: GameUI) => void) | ((game: GameUI) => GameUI),
) {
  useRemoteGameState.setState((state) => {
    if (!state.games[gameId]) {
      throw new Error(`Cannot modify remote game state of game ${gameId}`);
    }
    return {
      games: {
        ...state.games,
        [gameId]: {
          ...state.games[gameId],
          game: produce(state.games[gameId].game, recipe),
        },
      },
    };
  });
}

function settingsFromGameEntry(gameEntry: GameListEntry): GameSettings {
  const settings: GameSettings = {
    boardSize: gameEntry.boardSize,
    halfKomi: gameEntry.halfKomi,
    reserve: {
      pieces: gameEntry.pieces,
      capstones: gameEntry.capstones,
    },
    clock: {
      contingentMs: gameEntry.timeContingentSeconds * 1000,
      incrementMs: gameEntry.timeIncrementSeconds * 1000,
      extra: gameEntry.triggerMove
        ? {
            move: gameEntry.triggerMove.move,
            amountMs: gameEntry.triggerMove.amountSeconds * 1000,
          }
        : undefined,
    },
  };
  return settings;
}

const gameStartMessagePattern =
  /^Game Start (\d+) (\w+) vs (\w+) (white|black) (\d+) (\d+) (\d+) (\d+) (\d+) (\d+) (0|1) (0|1) (\d+) (\d+)/;

function parseGameStartMessage(
  message: string,
): { id: string; settings: GameSettings } | null {
  const match = gameStartMessagePattern.exec(message);
  if (!match) return null;
  const [
    ,
    id,
    _white,
    _black,
    _color,
    boardSize,
    time,
    increment,
    halfKomi,
    pieces,
    capstones,
    _unrated,
    _tournament,
    extraTriggerMove,
    extraTriggerAmount,
  ] = match;
  const extraTimeMs = parseInt(extraTriggerAmount) * 1000;
  const settings: GameSettings = {
    boardSize: parseInt(boardSize),
    halfKomi: parseInt(halfKomi),
    reserve: {
      pieces: parseInt(pieces),
      capstones: parseInt(capstones),
    },
    clock: {
      contingentMs: parseInt(time) * 1000,
      incrementMs: parseInt(increment) * 1000,
      extra:
        extraTimeMs > 0
          ? {
              move: parseInt(extraTriggerMove),
              amountMs: extraTimeMs,
            }
          : undefined,
    },
  };
  return { settings, id };
}

const gameUndoMessagePattern = /^Game#\d+ Undo/;

function isGameUndoMessage(message: string): boolean {
  return gameUndoMessagePattern.test(message);
}

const gameTimeMessagePattern = /^Game#\d+ Timems (\d+) (\d+)/;

function parseGameTimeMessage(message: string): TimeMessage | null {
  const matches = gameTimeMessagePattern.exec(message);
  if (!matches) return null;

  return {
    timestamp: new Date(),
    white: parseInt(matches[1]),
    black: parseInt(matches[2]),
  };
}

const gameDrawMessagePattern = /^Game#\d+ (Offer|Remove)Draw/;

function parseGameDrawMessage(message: string): boolean | null {
  const matches = gameDrawMessagePattern.exec(message);
  if (!matches) return null;
  return matches[1] === 'Offer';
}

const gameUndoOfferMessagePattern = /^Game#\d+ (Request|Remove)Undo/;

function parseGameUndoOfferMessage(message: string): boolean | null {
  const matches = gameUndoOfferMessagePattern.exec(message);
  if (!matches) return null;
  return matches[1] === 'Request';
}

function parseGameUpdateMessage(message: string): string | null {
  const matches = /^Game#(\d+) (.+)/.exec(message);
  if (!matches) return null;

  return matches[1];
}

const gameOverPattern = /^Game#\d+ Over (1\/2-1\/2|0-1|1-0|0-F|F-0|0-R|R-0)/;

function parseGameOverPattern(message: string): GameState | null {
  const matches = gameOverPattern.exec(message);
  if (!matches) return null;

  switch (matches[1]) {
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

const placeRegex = /Game#\d+ P ([A-Z])([1-9])(?: ([CW]))?/;
const parsePlaceMove = (placeMatch: RegExpMatchArray): Move => {
  const [, col, row] = placeMatch;
  const x = col.charCodeAt(0) - 'A'.charCodeAt(0);
  const y = row.charCodeAt(0) - '1'.charCodeAt(0);
  const variant: PieceVariant = placeMatch[3]
    ? placeMatch[3] === 'C'
      ? 'capstone'
      : 'standing'
    : 'flat';
  return {
    type: 'place',
    pos: { x, y },
    variant,
  };
};

const moveRegex = /Game#\d+ M ([A-Z])([1-9]) ([A-Z])([1-9])((?: [1-9])*)/;
const parseMoveMove = (moveMatch: RegExpMatchArray): Move => {
  const [, fromCol, fromRow, toCol, toRow, drops] = moveMatch;
  const dropNums = drops
    .split(' ')
    .filter((n) => n !== '')
    .map((d) => d.charCodeAt(0) - '0'.charCodeAt(0));
  const fromX = fromCol.charCodeAt(0) - 'A'.charCodeAt(0);
  const fromY = fromRow.charCodeAt(0) - '1'.charCodeAt(0);
  const toX = toCol.charCodeAt(0) - 'A'.charCodeAt(0);
  const toY = toRow.charCodeAt(0) - '1'.charCodeAt(0);
  const dir = dirFromAligned({ x: toX, y: toY }, { x: fromX, y: fromY });
  if (!dir) {
    console.error('invalid move received: from', { fromX, fromY }, 'to', {
      toX,
      toY,
    });
    throw new Error('invalid move received');
  }
  return {
    type: 'move',
    dir,
    drops: dropNums,
    from: { x: fromX, y: fromY },
  };
};

function parseObserveMessage(message: string): string | null {
  const matches = /^Observe (\d+)/.exec(message);
  if (!matches) return null;

  return matches[1];
}

function batch<T>(cb: (args: T[]) => void) {
  let queue: T[] = [];
  let scheduled = false;

  return (arg: T) => {
    queue.push(arg);
    if (!scheduled) {
      scheduled = true;
      setTimeout(() => {
        cb(queue);
        queue = [];
        scheduled = false;
      }, 1);
    }
  };
}
