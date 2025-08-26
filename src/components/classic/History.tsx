import { ScrollArea } from '@mantine/core';
import type { MoveRecord } from '../../packages/tak-core';
import { moveToString } from '../../packages/tak-core/move';
import type { GameUI } from '../../packages/tak-core/ui';
import { useEffect, useRef } from 'react';
import { gameResultToString } from '../../packages/tak-core/game';
export function History({
  game,
  onClick,
}: {
  game: GameUI;
  onClick: (plyIndex: number) => void;
}) {
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

  const makeHistoryItem = (index: number, move: string) => {
    return (
      <div className="min-w-12">
        <button
          className="text-left rounded-md px-1 hover:outline-2 text-nowrap"
          style={{
            width: '100%',
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
          <span className="font-bold">{move}</span>
        </button>
      </div>
    );
  };

  const rows = result.map(([whiteMove, blackMove], index) => (
    <div key={`move-${index.toString()}`} className="flex gap-2 p-1 font-mono">
      <div className="w-8">{index + 1}.</div>
      {whiteMove
        ? makeHistoryItem(index * 2 + 1, moveToString(whiteMove))
        : null}
      {blackMove
        ? makeHistoryItem(index * 2 + 2, moveToString(blackMove))
        : null}
    </div>
  ));

  if (game.actualGame.gameState.type !== 'ongoing') {
    rows.push(
      <div key="move-end" className="flex gap-2 p-1 font-mono">
        <div className="w-8" />
        <div className="min-w-12 font-bold">
          {gameResultToString(game.actualGame.gameState)}
        </div>
      </div>,
    );
  }

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
    <div className="flex flex-col rounded-md p-2 justify-center w-full h-0 grow pb-16">
      <ScrollArea
        viewportRef={viewport}
        className="grow"
        overscrollBehavior="contain"
      >
        <div className="flex flex-col">{rows}</div>
      </ScrollArea>
    </div>
  );
}
