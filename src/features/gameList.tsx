import { useCallback, useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import type { TextMessage } from '../auth';
import { useWSListener } from '../authHooks';
import { isDefined } from './utils';
import { useRatings } from '../api/ratings';
import { logError } from '../logger';

export interface GameListEntry {
  id: number;
  white: string;
  black: string;
  boardSize: number;
  timeContingentSeconds: number;
  timeIncrementSeconds: number;
  halfKomi: number;
  pieces: number;
  capstones: number;
  unrated: boolean;
  tournament: boolean;
  triggerMove:
    | {
        move: number;
        amountSeconds: number;
      }
    | undefined;
}

interface GameListState {
  games: Record<string, GameListEntry | undefined>;
  removedGames: Record<string, GameListEntry | undefined>;
}

export const useGameListState = create<GameListState>(() => ({
  games: {},
  removedGames: {},
}));

export function useGamesList() {
  const games = useGameListState((state) => state.games);
  return useMemo(() => {
    return Object.values(games).filter(isDefined);
  }, [games]);
}

export function usePlayerInfo(game: GameListEntry) {
  const ratings = useRatings([game.white, game.black]);
  const playerInfo = {
    white: {
      username: game.white,
      rating: ratings[game.white]?.rating,
    },
    black: {
      username: game.black,
      rating: ratings[game.black]?.rating,
    },
  };
  return playerInfo;
}

export function useGameById(gameId: string) {
  return useGameListState(
    (state) => state.games[gameId] ?? state.removedGames[gameId],
  );
}

export function useActiveGameByUsername(username: string | undefined) {
  const activeGame = useGameListState((state) => {
    if (username === undefined) return undefined;
    return Object.values(state.games).find(
      (g) => g?.white === username || g?.black === username,
    );
  });
  const [lastActiveGame, setLastActiveGame] = useState(activeGame);
  useEffect(() => {
    if (activeGame) {
      setLastActiveGame(activeGame);
    }
  }, [activeGame]);

  return lastActiveGame;
}

export function useRemovedGamesList() {
  const removedGames = useGameListState((state) => state.removedGames);
  return useMemo(() => {
    return Object.values(removedGames).filter(isDefined);
  }, [removedGames]);
}

export function addGame(game: GameListEntry) {
  useGameListState.setState((state) => ({
    games: {
      ...state.games,
      [game.id.toString()]: game,
    },
  }));
}

export function removeGame(gameId: string) {
  useGameListState.setState((state) => {
    const { [gameId]: removed, ...games } = state.games;
    return {
      games,
      removedGames: { ...state.removedGames, [gameId]: removed },
    };
  });
}

export function removeAllGames() {
  useGameListState.setState({ games: {}, removedGames: {} });
}

export function useUpdateGames() {
  const onMessage = useCallback((msg: TextMessage) => {
    const text = msg.text;
    if (text.startsWith('GameList Add')) {
      const newGame = parseGameAddMessage(text);
      if (newGame) {
        addGame(newGame);
      } else {
        logError('Failed to add game:', text);
      }
    } else if (text.startsWith('GameList Remove')) {
      const removedGameId = parseRemoveGameMessage(text);
      if (removedGameId !== null) {
        removeGame(removedGameId.toString());
      } else {
        logError('Failed to remove game:', text);
      }
    }
  }, []);

  const onOpen = useCallback(() => {
    removeAllGames();
  }, []);

  useWSListener('update-game-list', { onMessage, onOpen });
}

const gameAddRegex =
  /^GameList Add (\d+) ([A-Za-z0-9_]+) ([A-Za-z0-9_]+) (\d+) (\d+) (\d+) (\d+) (\d+) (\d+) (0|1) (0|1) (\d+) (\d+)/;
const gameRemoveRegex = /^GameList Remove (\d+)/;

function parseGameAddMessage(message: string): GameListEntry | null {
  const matches = gameAddRegex.exec(message);
  if (!matches) return null;

  return {
    id: parseInt(matches[1]),
    white: matches[2],
    black: matches[3],
    boardSize: parseInt(matches[4]),
    timeContingentSeconds: parseInt(matches[5]),
    timeIncrementSeconds: parseInt(matches[6]),
    halfKomi: parseInt(matches[7]),
    pieces: parseInt(matches[8]),
    capstones: parseInt(matches[9]),
    unrated: matches[10] === '1',
    tournament: matches[11] === '1',
    triggerMove:
      parseInt(matches[12]) > 0
        ? {
            move: parseInt(matches[12]),
            amountSeconds: parseInt(matches[13]),
          }
        : undefined,
  };
}

function parseRemoveGameMessage(message: string): number | null {
  const matches = gameRemoveRegex.exec(message);
  if (!matches) return null;

  return parseInt(matches[1]);
}
