import { ScrollArea } from '@mantine/core';
import type { MoveRecord, Player } from '../../packages/tak-core';
import { moveToString } from '../../packages/tak-core/move';
import type { GameUI } from '../../packages/tak-core/ui';
import { useSettings } from '../../settings';
import { useEffect, useRef } from 'react';
import { FaHandshake, FaHandshakeSlash } from 'react-icons/fa';
import { useUpdate } from 'react-use';

export function History({
  game,
  hasDrawOffer,
  onClick,
  sendDrawOffer,
}: {
  game: GameUI;
  hasDrawOffer?: boolean;
  onClick: (plyIndex: number) => void;
  sendDrawOffer?: (offer: boolean) => void;
}) {
  const { themeParams } = useSettings();

  const hasOfferedDraw = useRef(false);
  const update = useUpdate();

  const setHasOfferedDraw = (value: boolean) => {
    hasOfferedDraw.current = value;
    sendDrawOffer?.(value);
    update();
    console.log('Set draw offer to', value);
  };

  const perChunk = 2; // items per chunk

  const result = game.actualGame.history.reduce<(MoveRecord | undefined)[][]>(
    (resultArray, item, index) => {
      const chunkIndex = Math.floor(index / perChunk);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [];
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    },
    [],
  );
  if (result.length === 0) {
    result.push([undefined, undefined]);
  }

  const makeHistoryItem = (index: number, player: Player, move: MoveRecord) => {
    const colors =
      (player === 'white') === index > 2
        ? themeParams.piece1
        : themeParams.piece2;
    return (
      <div className="min-w-12">
        <button
          className="text-left rounded-md px-1 hover:outline-2 text-nowrap"
          style={{
            width: '100%',
            backgroundColor: colors.background,
            color: colors.text ?? colors.border,
            outlineColor: colors.border,
            opacity: game.plyIndex !== null && game.plyIndex < index ? 0.5 : 1,
          }}
          onClick={() => {
            if (
              (game.plyIndex !== null && game.plyIndex === index) ||
              (game.plyIndex === null &&
                game.actualGame.history.length === index)
            ) {
              onClick(index - 1);
            } else {
              onClick(index);
            }
          }}
        >
          <span className="font-bold">{moveToString(move)}</span>
        </button>
      </div>
    );
  };

  const rows = result.map(([whiteMove, blackMove], index) => (
    <div key={`move-${index.toString()}`} className="flex gap-2 p-1 font-mono">
      <div className="w-8">{index + 1}.</div>
      {whiteMove ? makeHistoryItem(index * 2 + 1, 'white', whiteMove) : null}
      {blackMove ? makeHistoryItem(index * 2 + 2, 'black', blackMove) : null}
    </div>
  ));

  const viewport = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (!viewport.current) return;
    viewport.current.scrollTo({
      top: 1000000,
      left: 1000000,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [game.actualGame.history.length]);

  return (
    <div
      className="flex flex-col rounded-md p-2 m-2 justify-center lg:ml-4 lg:w-72 lg:h-128"
      style={{ color: themeParams.text, backgroundColor: themeParams.board1 }}
    >
      {sendDrawOffer &&
        (!hasOfferedDraw.current || hasDrawOffer ? (
          <FaHandshake
            className={`m-2 ${hasDrawOffer ? 'hover:outline-3 outline-2' : 'hover:outline-2'} rounded-md p-1 cursor-pointer`}
            size={32}
            style={{
              color: themeParams.text,
              outlineColor: themeParams.text,
              backgroundColor: hasDrawOffer ? themeParams.highlight : undefined,
            }}
            onClick={() => {
              setHasOfferedDraw(true);
            }}
          />
        ) : (
          <FaHandshakeSlash
            className="m-2 hover:outline-2 rounded-md p-1 cursor-pointer"
            size={32}
            style={{
              color: themeParams.text,
              outlineColor: themeParams.text,
            }}
            onClick={() => {
              setHasOfferedDraw(false);
            }}
          />
        ))}
      <ScrollArea
        viewportRef={viewport}
        className="grow"
        overscrollBehavior="contain"
      >
        <div className="flex lg:flex-col">{rows}</div>
      </ScrollArea>
    </div>
  );
}
