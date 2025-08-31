import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGameListState } from './gameList';
import { useAuth, useWSAPI } from '../authHooks';
import type { ChatEntry } from '../gameData';
import { useGameData } from '../gameDataHooks';

export const globalId = '$global';

export interface ChatTab {
  type: 'global' | 'private' | 'room';
  id: string;
  label: string;
}

export function useChatTabs(gameId: string | undefined) {
  const games = useGameListState((state) => state.games);
  const removedGames = useGameListState((state) => state.removedGames);

  const { user } = useAuth();

  const shownTabs = useMemo(() => {
    const shownTabs: Record<
      string,
      | { type: 'global' | 'private' | 'room'; id: string; label: string }
      | undefined
    > = {
      [globalId]: { type: 'global', id: globalId, label: 'Global' },
    };
    const entry =
      gameId !== undefined
        ? (games[gameId] ?? removedGames[gameId])
        : undefined;
    if (entry) {
      if (user?.username === entry.white) {
        shownTabs[`$priv:${entry.black}`] = {
          type: 'private',
          id: entry.black,
          label: entry.black,
        };
      } else if (user?.username === entry.black) {
        shownTabs[`$priv:${entry.white}`] = {
          type: 'private',
          id: entry.white,
          label: entry.white,
        };
      } else {
        const sortedPlayers = [entry.white, entry.black].sort();
        const key = sortedPlayers.join('-');
        const label = sortedPlayers.join(' vs. ');
        shownTabs[`$room:${key}`] = { type: 'room', id: key, label };
      }
    }
    return shownTabs;
  }, [gameId, games, removedGames, user?.username]);

  return shownTabs;
}

export function useGetEntries() {
  const { chats } = useGameData();

  const getEntries = useCallback(
    (type: string, id: string) => {
      switch (type) {
        case 'global':
          return chats.global;
        case 'private':
          return chats.private[id];
        case 'room':
          return chats.room[id];
        default:
          return [];
      }
    },
    [chats],
  );
  return getEntries;
}

const mapChatEntries = (entry: ChatEntry[]) =>
  entry.map((e) => ({
    message: e.message,
    sender: e.sender,
    timestamp: formatTimestamp(e.timestamp),
  }));

const formatTimestamp = (time: Date) => {
  return time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export function useTabValues(
  selectedTab: string,
  shownTabs: Record<string, ChatTab | undefined>,
) {
  const getEntries = useGetEntries();
  const tabValues = useMemo(() => {
    return mapChatEntries(
      getEntries(
        shownTabs[selectedTab]?.type ?? 'global',
        shownTabs[selectedTab]?.id ?? globalId,
      ) ?? [],
    );
  }, [getEntries, shownTabs, selectedTab]);
  return tabValues;
}

export function useChatInterface(gameId: string | undefined) {
  const shownTabs = useChatTabs(gameId);

  const { sendMessage } = useWSAPI();

  const defaultId =
    Object.keys(shownTabs).find((key) => key !== globalId) ?? globalId;

  const [selectedTab, setSelectedTab] = useState<string>(defaultId);
  const tabValues = useTabValues(selectedTab, shownTabs);

  useEffect(() => {
    const tab = shownTabs[selectedTab];
    if (!tab && selectedTab !== globalId) {
      setSelectedTab(defaultId);
    }
  }, [defaultId, shownTabs, selectedTab]);

  const [sendValue, setSendValue] = useState<string>('');

  const onClickSend = () => {
    const tab = shownTabs[selectedTab];
    if (sendValue.trim() && tab) {
      if (tab.type === 'global') {
        sendMessage(`Shout ${sendValue}`);
      } else if (tab.type === 'private') {
        sendMessage(`Tell ${tab.id} ${sendValue}`);
      } else {
        sendMessage(`ShoutRoom ${tab.id} ${sendValue}`);
      }
      setSendValue('');
    }
  };

  return {
    shownTabs,
    selectedTab,
    setSelectedTab,
    tabValues,
    sendValue,
    setSendValue,
    onClickSend,
  };
}
