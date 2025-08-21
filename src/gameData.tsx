import { useSeeks } from './api/seeks';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type TextMessage } from './auth';
import type { Player } from './packages/tak-core';
import { useWSListener } from './authHooks';

export interface GameDataState {
  seeks: SeekEntry[];
  games: GameListEntry[];
  gameInfo: Record<string, GameInfoEntry | undefined>;
  removeGameInfo: (id: string) => void;
}

export interface SeekEntry {
  id: number;
  creator: string;
  timeContingent: number;
  timeIncrement: number;
  komi: number;
  boardSize: number;
  capstones: number;
  pieces: number;
  unrated: boolean;
  tournament: boolean;
  color: string;
  opponent?: string | undefined;
  triggerMove?:
    | {
        move: number;
        amount: number;
      }
    | undefined;
}

export interface GameListEntry {
  id: number;
  white: string;
  black: string;
  boardSize: number;
  timeContingent: number;
  timeIncrement: number;
  komi: number;
  pieces: number;
  capstones: number;
  unrated: boolean;
  tournament: boolean;
  triggerMove:
    | {
        move: number;
        amount: number;
      }
    | undefined;
}

export type TimeMessage = {
  timestamp: Date;
} & Record<Player, number>;

export interface GameInfoEntry {
  messages: string[];
  moveMessages: string[];
  timeMessages: TimeMessage[];
}

const GameDataContext = createContext<GameDataState | undefined>(undefined);

const seekAddRegex =
  /^Seek new (\d+) ([A-Za-z0-9_]+) (\d+) (\d+) (\d+) ([WBA]) (\d+) (\d+) (\d+) (0|1) (0|1) (\d+) (\d+) ([A-Za-z0-9_]*)/;
const seekRemoveRegex = /^Seek remove (\d+)/;

const gameAddRegex =
  /^GameList Add (\d+) ([A-Za-z0-9_]+) ([A-Za-z0-9_]+) (\d+) (\d+) (\d+) (\d+) (\d+) (\d+) (0|1) (0|1) (\d+) (\d+)/;
const gameRemoveRegex = /^GameList Remove (\d+)/;

function parseAddSeekMessage(message: string): SeekEntry | null {
  const matches = seekAddRegex.exec(message);
  if (!matches) return null;

  const triggerMoveAmount = parseInt(matches[13]);
  const opponent = matches[14];

  return {
    id: parseInt(matches[1]),
    creator: matches[2],
    boardSize: parseInt(matches[3]),
    timeContingent: parseInt(matches[4]),
    timeIncrement: parseInt(matches[5]),
    color: matches[6] as 'W' | 'B' | 'A',
    komi: parseInt(matches[7]),
    pieces: parseInt(matches[8]),
    capstones: parseInt(matches[9]),
    unrated: matches[10] === '1',
    tournament: matches[11] === '1',
    triggerMove:
      triggerMoveAmount > 0
        ? {
            move: parseInt(matches[12]),
            amount: triggerMoveAmount,
          }
        : undefined,
    opponent: opponent === '0' ? undefined : opponent,
  };
}

function parseRemoveSeekMessage(message: string): number | null {
  const matches = seekRemoveRegex.exec(message);
  if (!matches) return null;

  return parseInt(matches[1]);
}

function parseGameAddMessage(message: string): GameListEntry | null {
  const matches = gameAddRegex.exec(message);
  if (!matches) return null;

  return {
    id: parseInt(matches[1]),
    white: matches[2],
    black: matches[3],
    boardSize: parseInt(matches[4]),
    timeContingent: parseInt(matches[5]),
    timeIncrement: parseInt(matches[6]),
    komi: parseInt(matches[7]),
    pieces: parseInt(matches[8]),
    capstones: parseInt(matches[9]),
    unrated: matches[10] === '1',
    tournament: matches[11] === '1',
    triggerMove:
      parseInt(matches[12]) > 0
        ? {
            move: parseInt(matches[12]),
            amount: parseInt(matches[13]),
          }
        : undefined,
  };
}

function parseRemoveGameMessage(message: string): number | null {
  const matches = gameRemoveRegex.exec(message);
  if (!matches) return null;

  return parseInt(matches[1]);
}

const gameMoveMessagePattern = /^Game#\d+ [MP]/;

function isGameMoveMessage(message: string): boolean {
  return gameMoveMessagePattern.test(message);
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

function parseGameUpdateMessage(message: string): string | null {
  const matches = /^Game#(\d+) (.+)/.exec(message);
  if (!matches) return null;

  return matches[1];
}

function parseObserveMessage(message: string): string | null {
  const matches = /^Observe (\d+)/.exec(message);
  if (!matches) return null;

  return matches[1];
}

export function GameDataProvider({ children }: { children: React.ReactNode }) {
  const [gameInfo, setGameInfo] = useState<
    Record<string, GameInfoEntry | undefined>
  >({});

  const { data: freshSeeks } = useSeeks();

  const [seeks, setSeeks] = useState<SeekEntry[]>([]);
  const [games, setGames] = useState<GameListEntry[]>([]);

  const onMsg = (msg: TextMessage) => {
    const text = msg.text;
    console.log('Called with message:', text);
    if (text.startsWith('Seek new')) {
      const newSeek = parseAddSeekMessage(text);
      if (newSeek) {
        setSeeks((prev) =>
          prev.find((s) => s.id === newSeek.id) ? prev : [...prev, newSeek],
        );
      } else {
        console.error('Failed to add seek:', text);
      }
    } else if (text.startsWith('Seek remove')) {
      const removedSeek = parseRemoveSeekMessage(text);
      if (removedSeek) {
        setSeeks((prev) => prev.filter((s) => s.id !== removedSeek));
      } else {
        console.error('Failed to remove seek:', text);
      }
    } else if (text.startsWith('GameList Add')) {
      const newGame = parseGameAddMessage(text);
      if (newGame) {
        setGames((prev) =>
          prev.find((g) => g.id === newGame.id) ? prev : [...prev, newGame],
        );
      } else {
        console.error('Failed to add game:', text);
      }
    } else if (text.startsWith('GameList Remove')) {
      const removedGame = parseRemoveGameMessage(text);
      if (removedGame) {
        setGames((prev) => prev.filter((g) => g.id !== removedGame));
      } else {
        console.error('Failed to remove game:', text);
      }
    } else if (text.startsWith('Game#')) {
      const id = parseGameUpdateMessage(text);
      if (id) {
        const timeMessage = parseGameTimeMessage(text);
        setGameInfo((prev) => ({
          ...prev,
          [id]: {
            messages: [...(prev[id]?.messages ?? []), text],
            moveMessages: [
              ...(prev[id]?.moveMessages ?? []),
              ...(isGameMoveMessage(text) ? [text] : []),
            ],
            timeMessages: [
              ...(prev[id]?.timeMessages ?? []),
              ...(timeMessage ? [timeMessage] : []),
            ],
          },
        }));
      } else {
        console.error('Failed to update game:', text);
      }
    } else if (text.startsWith('Observe')) {
      const id = parseObserveMessage(text);
      if (id) {
        console.log('Received observe message for game:', id);
        setGameInfo((prev) => {
          const newGameInfo = { ...prev };
          const { [id]: _, ...rest } = newGameInfo;
          return rest;
        });
      } else {
        console.error('Failed to parse observe game message:', text);
      }
    }
  };

  useWSListener({
    onMessage: onMsg,
    onOpen: () => {
      setGameInfo({});
      setSeeks([]);
      setGames([]);
    },
    onClose: () => {
      console.warn('Removing game info');
      setGameInfo({});
    },
  });

  useEffect(() => {
    if (freshSeeks) {
      setSeeks(freshSeeks);
    }
  }, [freshSeeks]);

  const removeGameInfo = useCallback((id: string) => {
    setGameInfo((prev) => {
      const newGameInfo = { ...prev };
      const { [id]: _, ...rest } = newGameInfo;
      return rest;
    });
  }, []);

  const gameDataMemo = useMemo<GameDataState>(() => {
    return { seeks, games, gameInfo, removeGameInfo };
  }, [seeks, games, gameInfo, removeGameInfo]);

  return <GameDataContext value={gameDataMemo}>{children}</GameDataContext>;
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useGameData() {
  const context = use(GameDataContext);
  if (context === undefined) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
}
