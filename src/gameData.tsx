import useWebSocket from 'react-use-websocket';
import { WS_URL, wsOptions } from './websocket';
import { useSeeks } from './api/seeks';
import { createContext, useContext, useEffect, useState } from 'react';

export interface GameDataState {
  seeks: SeekEntry[];
  games: GameListEntry[];
  gameInfo: Record<string, GameInfoEntry>;
}

export type SeekEntry = {
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
};

export type GameListEntry = {
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
};

export type GameInfoEntry = {
  messages: string[];
};

const GameDataContext = createContext<GameDataState | undefined>(undefined);

export function GameDataProvider({ children }: { children: React.ReactNode }) {
  let { lastMessage } = useWebSocket(WS_URL, wsOptions);

  let { data: freshSeeks } = useSeeks();

  let [seeks, setSeeks] = useState<SeekEntry[]>([]);
  let [games, setGames] = useState<GameListEntry[]>([]);
  let [gameInfo, setGameInfo] = useState<Record<string, GameInfoEntry>>({});

  const seekAddRegex =
    /^Seek new (\d+) ([A-Za-z0-9_]+) (\d+) (\d+) (\d+) ([WBA]) (\d+) (\d+) (\d+) (0|1) (0|1) (\d+) (\d+) ([A-Za-z0-9_]*)/;
  const seekRemoveRegex = /^Seek remove (\d+)/;

  const gameAddRegex =
    /^GameList Add (\d+) ([A-Za-z0-9_]+) ([A-Za-z0-9_]+) (\d+) (\d+) (\d+) (\d+) (\d+) (\d+) (0|1) (0|1) (\d+) (\d+)/;
  const gameRemoveRegex = /^GameList Remove (\d+)/;

  function parseAddSeekMessage(message: string): SeekEntry | null {
    let matches = message.match(seekAddRegex);
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
      opponent: opponent == '0' ? undefined : opponent,
    };
  }

  function parseRemoveSeekMessage(message: string): number | null {
    let matches = message.match(seekRemoveRegex);
    if (!matches) return null;

    return parseInt(matches[1]);
  }

  function parseGameAddMessage(message: string): GameListEntry | null {
    let matches = message.match(gameAddRegex);
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
    let matches = message.match(gameRemoveRegex);
    if (!matches) return null;

    return parseInt(matches[1]);
  }

  function parseGameUpdateMessage(
    message: string,
  ): { id: string; message: string } | null {
    let matches = message.match(/^Game#(\d+) (.+)/);
    if (!matches) return null;

    return {
      id: matches[1],
      message,
    };
  }

  function parseGameStartMessage(message: string): { id: string } | null {
    let matches = message.match(/^Game Start (\d+)/);
    if (!matches) return null;

    return {
      id: matches[1],
    };
  }

  useEffect(() => {
    if (lastMessage) {
      (async () => {
        const text = await (lastMessage.data as Blob).text();
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
          const gameUpdate = parseGameUpdateMessage(text);
          if (gameUpdate) {
            setGameInfo((prev) => ({
              ...prev,
              [gameUpdate.id]: {
                ...(prev[gameUpdate.id] ?? { messages: [] }),
                messages: [
                  ...(prev[gameUpdate.id]?.messages ?? []),
                  gameUpdate.message,
                ],
              },
            }));
          } else {
            console.error('Failed to update game:', text);
          }
        } else if (text.startsWith('Game Start')) {
          const gameStart = parseGameStartMessage(text);
          console.log('game start');
          if (gameStart) {
            setGameInfo((prev) => ({
              ...prev,
              [gameStart.id]: {
                messages: [],
              },
            }));
          } else {
            console.error('Failed to start game:', text);
          }
        }
      })();
    }
  }, [lastMessage]);

  useEffect(() => {
    if (freshSeeks) {
      setSeeks(freshSeeks);
    }
  }, [freshSeeks]);

  return (
    <GameDataContext.Provider value={{ seeks, games, gameInfo }}>
      {children}
    </GameDataContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useGameData() {
  const context = useContext(GameDataContext);
  if (context === undefined) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
}
