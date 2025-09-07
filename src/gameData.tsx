import { useCallback, useMemo, useState } from 'react';
import { type TextMessage } from './auth';
import type { Player } from './packages/tak-core';
import { useAuth, useWSListener } from './authHooks';
import { GameDataContext } from './gameDataHooks';
import { notifications } from '@mantine/notifications';
import { useInterval } from 'react-use';
import { useUpdateSeeks } from './features/seeks';
import { useUpdateGames } from './features/gameList';
import { useUpdatePlayers } from './features/players';
import { useUpdateRemoteGames } from './features/remoteGame';
import { logDebug, logError } from './logger';

export interface GameDataState {
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

export function GameDataProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<ChatData>({
    private: {},
    room: {},
    global: [],
  });

  const { user } = useAuth();

  useUpdateSeeks();
  useUpdateGames();
  useUpdatePlayers();
  useUpdateRemoteGames();

  const onMsg = useCallback(
    (msg: TextMessage) => {
      const text = msg.text;
      logDebug('Called with message:', text);
      if (text.startsWith('Tell')) {
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
          logDebug('Received tell message from', sender, ':', message);
        } else {
          logError('Failed to parse tell message:', text);
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
          logDebug('Received told message from', sender, ':', message);
        } else {
          logError('Failed to parse told message:', text);
        }
      }
    },
    [user],
  );

  const onClose = useCallback((ev: CloseEvent) => {
    notifications.show({
      title: 'Connection closed',
      message: `Connection closed ${ev.wasClean ? 'cleanly' : 'abruptly'}: ${ev.reason || 'No reason provided'}`,
      position: 'top-right',
    });
  }, []);

  const { sendMessage } = useWSListener('GameData', {
    onMessage: onMsg,
    onClose,
  });

  useInterval(() => {
    sendMessage('PING');
  }, 10000);

  const gameDataMemo = useMemo<GameDataState>(() => {
    return { chats };
  }, [chats]);

  return <GameDataContext value={gameDataMemo}>{children}</GameDataContext>;
}
