import { useDisclosure } from '@mantine/hooks';
import { FaArrowLeft, FaArrowRight, FaPaperPlane } from 'react-icons/fa6';
import { Button, Input, ScrollArea, Select, Transition } from '@mantine/core';
import { Fragment } from 'react';
import { globalId, useChatInterface } from '../../features/chat';

export function ChatDrawer({ gameId }: { gameId?: string }) {
  const [isSideOpen, { toggle: toggleSide }] = useDisclosure(true);
  const {
    sendValue,
    onClickSend,
    shownTabs,
    selectedTab,
    setSendValue,
    setSelectedTab,
    tabValues,
  } = useChatInterface(gameId);

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
        duration={100}
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
