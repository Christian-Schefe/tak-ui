import { useCallback, useMemo, useState } from 'react';
import { type TextMessage } from './auth';
import type { GameState, Player } from './packages/tak-core';
import { useAuth, useWSListener } from './authHooks';
import { GameDataContext } from './gameDataHooks';
import { notifications } from '@mantine/notifications';
import { useInterval } from 'react-use';
import { useGameOfferState } from './features/gameOffers';
import { removeAllSeeks, useUpdateSeeks } from './features/seeks';
import { removeAllGames, useUpdateGames } from './features/gameList';
import { useUpdatePlayers } from './features/players';

export interface GameDataState {
  gameInfo: Record<string, GameInfoEntry | undefined>;
  chats: ChatData;
}

export interface ChatData {
  private: Record<string, ChatEntry[] | undefined>;
  room: Record<string, ChatEntry[] | undefined>;
  global: ChatEntry[];
}

export interface ChatEntry {
  sender: string;
  message: string;
  timestamp: Date;
}

export type TimeMessage = {
  timestamp: Date;
} & Record<Player, number>;

export interface GameInfoEntry {
  messages: string[];
  moveMessages: (string | GameState)[];
  timeMessages: TimeMessage[];
  drawOffer: boolean;
  undoOffer: boolean;
}

const gameMoveMessagePattern = /^Game#\d+ [MP]/;

function isGameMoveMessage(message: string): boolean {
  return gameMoveMessagePattern.test(message);
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

function parseObserveMessage(message: string): string | null {
  const matches = /^Observe (\d+)/.exec(message);
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

export function GameDataProvider({ children }: { children: React.ReactNode }) {
  const [gameInfo, setGameInfo] = useState<
    Record<string, GameInfoEntry | undefined>
  >({});

  const [chats, setChats] = useState<ChatData>({
    private: {},
    room: {},
    global: [],
  });

  const gameOffers = useGameOfferState();

  const { user } = useAuth();

  useUpdateSeeks();
  useUpdateGames();
  useUpdatePlayers();

  const onMsg = useCallback(
    (msg: TextMessage) => {
      const text = msg.text;
      console.log('Called with message:', text);
      if (text.startsWith('Game#')) {
        const id = parseGameUpdateMessage(text);
        if (id !== null) {
          const timeMessage = parseGameTimeMessage(text);
          const drawOffer = parseGameDrawMessage(text);
          const undoOffer = parseGameUndoOfferMessage(text);
          const gameOver = parseGameOverPattern(text);
          const isUndo = isGameUndoMessage(text);
          const moveMessage = isGameMoveMessage(text)
            ? [text]
            : isUndo
              ? ['undo']
              : gameOver
                ? [gameOver]
                : [];
          setGameInfo((prev) => ({
            ...prev,
            [id]: prev[id]
              ? {
                  messages: [...prev[id].messages, text],
                  moveMessages: [...prev[id].moveMessages, ...moveMessage],
                  timeMessages: [
                    ...prev[id].timeMessages,
                    ...(timeMessage ? [timeMessage] : []),
                  ],
                  drawOffer: drawOffer ?? prev[id].drawOffer,
                  undoOffer: undoOffer ?? (prev[id].undoOffer && !isUndo),
                }
              : {
                  messages: [text],
                  moveMessages: moveMessage,
                  timeMessages: timeMessage ? [timeMessage] : [],
                  drawOffer: drawOffer ?? false,
                  undoOffer: undoOffer ?? false,
                },
          }));
          if (isUndo) {
            gameOffers.setHasOfferedUndo(id, false);
          }
          if (gameOver) {
            gameOffers.removeGameState(id);
          }
        } else {
          console.error('Failed to update game:', text);
        }
      } else if (text.startsWith('Observe')) {
        const id = parseObserveMessage(text);
        if (id !== null) {
          console.log('Received observe message for game:', id);
          setGameInfo((prev) => {
            const newGameInfo = { ...prev };
            const { [id]: _, ...rest } = newGameInfo;
            return rest;
          });
        } else {
          console.error('Failed to parse observe game message:', text);
        }
      } else if (text.startsWith('Tell')) {
        const matches = /^Tell <(.*)> (.+)/.exec(text);
        if (matches) {
          const sender = matches[1];
          const message = matches[2];
          setChats((prev) => ({
            ...prev,
            private: {
              ...prev.private,
              [sender]: [
                ...(prev.private[sender] ?? []),
                {
                  message,
                  sender,
                  timestamp: new Date(),
                },
              ],
            },
          }));
          console.log('Received tell message from', sender, ':', message);
        } else {
          console.error('Failed to parse tell message:', text);
        }
      } else if (text.startsWith('Told')) {
        const matches = /^Told <(.*)> (.+)/.exec(text);
        if (matches) {
          const receiver = matches[1];
          const message = matches[2];
          const sender = user?.username ?? 'You';
          setChats((prev) => ({
            ...prev,
            private: {
              ...prev.private,
              [receiver]: [
                ...(prev.private[receiver] ?? []),
                {
                  message,
                  sender,
                  timestamp: new Date(),
                },
              ],
            },
          }));
          console.log('Received told message from', sender, ':', message);
        } else {
          console.error('Failed to parse told message:', text);
        }
      }
    },
    [user, gameOffers],
  );

  const onOpen = useCallback(() => {
    console.warn('Removing data');
    setGameInfo({});

    removeAllSeeks();
    removeAllGames();

    notifications.show({
      title: 'Connection opened',
      message: 'Connection opened',
      position: 'top-right',
    });
  }, []);

  const onClose = useCallback((ev: CloseEvent) => {
    notifications.show({
      title: 'Connection closed',
      message: `Connection closed ${ev.wasClean ? 'cleanly' : 'abruptly'}: ${ev.reason || 'No reason provided'}`,
      position: 'top-right',
    });
  }, []);

  const { sendMessage } = useWSListener('GameData', {
    onMessage: onMsg,
    onOpen,
    onClose,
  });

  useInterval(() => {
    sendMessage('PING');
  }, 10000);

  const gameDataMemo = useMemo<GameDataState>(() => {
    return { gameInfo, chats };
  }, [gameInfo, chats]);

  return <GameDataContext value={gameDataMemo}>{children}</GameDataContext>;
}
