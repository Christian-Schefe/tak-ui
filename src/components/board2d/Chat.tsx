import { Button, Input, ScrollArea, Select } from '@mantine/core';
import { useSettings } from '../../useSettings';
import { Fragment } from 'react/jsx-runtime';
import { FaPaperPlane } from 'react-icons/fa6';
import { globalId, useChatInterface } from '../../features/chat';

export function Chat({ gameId }: { gameId?: string }) {
  const { themeParams } = useSettings();
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
      className="flex flex-col rounded-md p-2 m-2 justify-center self-stretch lg:self-center lg:w-72 lg:max-h-200 h-full"
      style={{ color: themeParams.text, backgroundColor: themeParams.board1 }}
    >
      <div className="flex flex-col grow w-full overflow-hidden p-2 gap-2">
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
        <ScrollArea
          className="grow h-fit max-h-80 min-h-40 lg:min-h-0 lg:max-h-none w-full lg:pb-16"
          styles={{ scrollbar: { backgroundColor: 'transparent' } }}
        >
          {tabValues.map((msg, index) => (
            <Fragment key={`${msg.timestamp}-${index.toString()}`}>
              {index === 0 ||
              msg.timestamp !== tabValues[index - 1].timestamp ? (
                <p>{msg.timestamp}</p>
              ) : null}
              <p>
                <span className="font-bold">{msg.sender}</span>: {msg.message}
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
    </div>
  );
}
