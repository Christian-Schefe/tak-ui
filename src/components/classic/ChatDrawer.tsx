import { useDisclosure } from '@mantine/hooks';
import { FaArrowLeft, FaArrowRight, FaPaperPlane } from 'react-icons/fa';
import { Button, Input, ScrollArea, Select, Transition } from '@mantine/core';
import { useGameData } from '../../gameDataHooks';
import { Fragment, useEffect, useMemo, useState } from 'react';
import type { ChatEntry } from '../../gameData';
import { useWSAPI } from '../../authHooks';

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

export function ChatDrawer() {
  const [isSideOpen, { toggle: toggleSide }] = useDisclosure(true);
  const { chats } = useGameData();
  const { sendMessage } = useWSAPI();

  const { tabs, values } = useMemo(() => {
    const values: Record<
      string,
      { message: string; sender: string; timestamp: string }[] | undefined
    > = { $global: mapChatEntries(chats.global) };
    const tabs = [{ value: globalId, label: 'Global' }];
    for (const [key, value] of Object.entries(chats.private)) {
      const id = `$priv:${key}`;
      if (value) {
        values[id] = mapChatEntries(value);
        tabs.push({ value: id, label: key });
      }
    }
    for (const [key, value] of Object.entries(chats.room)) {
      const id = `$room:${key}`;
      if (value) {
        values[id] = mapChatEntries(value);
        tabs.push({ value: id, label: key });
      }
    }
    return { tabs, values };
  }, [chats]);

  const [selectedTab, setSelectedTab] = useState<string>(globalId);

  useEffect(() => {
    if (!values[selectedTab] && selectedTab !== globalId) {
      setSelectedTab(globalId);
    }
  }, [values, selectedTab]);

  const [sendValue, setSendValue] = useState<string>('');

  const onClickSend = () => {
    if (sendValue.trim()) {
      if (selectedTab === globalId) {
        //sendMessage(`Shout ${sendValue}`);
      } else if (selectedTab.startsWith('$priv:')) {
        sendMessage(`Tell ${selectedTab.replace('$priv:', '')} ${sendValue}`);
      } else {
        sendMessage(
          `ShoutRoom ${selectedTab.replace('$room:', '')} ${sendValue}`,
        );
      }
      setSendValue('');
    }
  };

  return (
    <div
      className="flex flex-col relative"
      style={{ width: isSideOpen ? '16rem' : '0', transition: 'width 0.2s' }}
    >
      <Transition
        mounted={isSideOpen}
        transition="fade"
        duration={200}
        timingFunction="ease"
      >
        {(transitionStyles) => (
          <div
            className="flex flex-col grow w-full overflow-hidden p-2 gap-2"
            style={transitionStyles}
          >
            <Select
              data={tabs}
              value={selectedTab}
              onChange={(e) => {
                setSelectedTab(e ?? globalId);
              }}
            />
            <ScrollArea className="grow h-0 w-full pb-16">
              {values[selectedTab]?.map((msg, index) => (
                <Fragment key={`${msg.timestamp}-${index.toString()}`}>
                  {index === 0 ||
                  msg.timestamp !==
                    values[selectedTab]?.[index - 1].timestamp ? (
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
