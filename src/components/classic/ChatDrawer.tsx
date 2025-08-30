import { useDisclosure } from '@mantine/hooks';
import { FaArrowLeft, FaArrowRight, FaPaperPlane } from 'react-icons/fa';
import { Button, Input, ScrollArea, Select, Transition } from '@mantine/core';
import { useGameData } from '../../gameDataHooks';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import type { ChatEntry } from '../../gameData';
import { useAuth, useWSAPI } from '../../authHooks';
import { useGameListState } from '../../features/gameList';

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

const globalId = '$global';

export function ChatDrawer({ gameId }: { gameId?: string }) {
  const [isSideOpen, { toggle: toggleSide }] = useDisclosure(true);
  const { chats } = useGameData();
  const games = useGameListState((state) => state.games);
  const removedGames = useGameListState((state) => state.removedGames);
  const { sendMessage } = useWSAPI();
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

  const defaultId =
    Object.keys(shownTabs).find((key) => key !== globalId) ?? globalId;

  const [selectedTab, setSelectedTab] = useState<string>(defaultId);
  const tabValues = useMemo(() => {
    return mapChatEntries(
      getEntries(
        shownTabs[selectedTab]?.type ?? 'global',
        shownTabs[selectedTab]?.id ?? globalId,
      ) ?? [],
    );
  }, [getEntries, shownTabs, selectedTab]);

  useEffect(() => {
    const tab = shownTabs[selectedTab];
    if (!tab && selectedTab !== globalId) {
      setSelectedTab(defaultId);
    }
  }, [getEntries, defaultId, shownTabs, selectedTab]);

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

  return (
    <div
      className="flex flex-col relative"
      style={{
        width: isSideOpen ? '16rem' : '0',
        transition: 'width 0.25s',
        backgroundColor: 'var(--mantine-color-body)',
      }}
    >
      <Transition
        mounted={isSideOpen}
        transition="fade"
        duration={150}
        enterDelay={100}
        timingFunction="ease"
      >
        {(transitionStyles) => (
          <div
            className="flex flex-col grow w-full overflow-hidden p-2 gap-2"
            style={transitionStyles}
          >
            <Select
              data={Object.entries(shownTabs)
                .map(([key, value]) =>
                  value
                    ? [
                        {
                          value: key,
                          label: value.label,
                        },
                      ]
                    : [],
                )
                .flat()}
              value={selectedTab}
              onChange={(e) => {
                setSelectedTab(e ?? globalId);
              }}
            />
            <ScrollArea className="grow h-0 w-full pb-16">
              {tabValues.map((msg, index) => (
                <Fragment key={`${msg.timestamp}-${index.toString()}`}>
                  {index === 0 ||
                  msg.timestamp !== tabValues[index - 1].timestamp ? (
                    <p>{msg.timestamp}</p>
                  ) : null}
                  <p>
                    <span className="font-bold">{msg.sender}</span>:{' '}
                    {msg.message}
                  </p>
                </Fragment>
              ))}
            </ScrollArea>
            <Input
              value={sendValue}
              onChange={(e) => {
                setSendValue(e.target.value);
              }}
            />
            <Button
              className="flex justify-center items-center gap-2"
              leftSection={<FaPaperPlane />}
              onClick={onClickSend}
            >
              Send
            </Button>
          </div>
        )}
      </Transition>
      <div className="absolute top-10 left-[-25px]">
        <Button onClick={toggleSide} w="25px" h="40px" p="2px">
          {isSideOpen ? <FaArrowRight /> : <FaArrowLeft />}
        </Button>
      </div>
    </div>
  );
}
