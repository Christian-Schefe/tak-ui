import { ScrollArea } from '@mantine/core';
import type { MoveRecord } from '../../packages/tak-core';
import { moveToString } from '../../packages/tak-core/move';
import type { GameUI } from '../../packages/tak-core/ui';
import { useSettings } from '../../settings';
import { useEffect, useRef } from 'react';

export function History({
  game,
  onClick,
}: {
  game: GameUI;
  onClick: (plyIndex: number) => void;
}) {
  const { themeParams } = useSettings();

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

  const rows = result.map(([whiteMove, blackMove], index) => (
    <div key={`move-${index.toString()}`} className="flex gap-2 p-1 font-mono">
      <div className="w-8">{index + 1}.</div>
      {whiteMove ? (
        <div className="min-w-12">
          <button
            className="text-left rounded-md px-1 hover:outline-2 text-nowrap"
            style={{
              width: '100%',
              backgroundColor: themeParams.piece1.background,
              color: themeParams.piece1.text ?? themeParams.piece1.border,
              outlineColor: themeParams.piece1.border,
              opacity:
                game.plyIndex !== null && game.plyIndex < index * 2 + 1
                  ? 0.5
                  : 1,
            }}
            onClick={() => {
              if (game.plyIndex !== null && game.plyIndex === index * 2 + 1) {
                onClick(index * 2);
              } else {
                onClick(index * 2 + 1);
              }
            }}
          >
            <span className="font-bold">{moveToString(whiteMove)}</span>
          </button>
        </div>
      ) : null}
      {blackMove ? (
        <div className="min-w-12">
          <button
            className="text-left rounded-md px-1 hover:outline-2 text-nowrap"
            style={{
              width: '100%',
              backgroundColor: themeParams.piece2.background,
              color: themeParams.piece2.text ?? themeParams.piece2.border,
              outlineColor: themeParams.piece2.border,
              opacity:
                game.plyIndex !== null && game.plyIndex < index * 2 + 2
                  ? 0.5
                  : 1,
            }}
            onClick={() => {
              if (game.plyIndex !== null && game.plyIndex === index * 2 + 2) {
                onClick(index * 2 + 1);
              } else {
                onClick(index * 2 + 2);
              }
            }}
          >
            <span className="font-bold">{moveToString(blackMove)}</span>
          </button>
        </div>
      ) : null}
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
      className="flex flex-col justify-center lg:ml-4 lg:w-72"
      style={{ color: themeParams.text }}
    >
      <ScrollArea
        viewportRef={viewport}
        className="lg:h-128 rounded-md p-2 m-2"
        style={{ backgroundColor: themeParams.board1 }}
        overscrollBehavior="contain"
      >
        <div className="flex lg:flex-col">{rows}</div>
      </ScrollArea>
    </div>
  );
}
