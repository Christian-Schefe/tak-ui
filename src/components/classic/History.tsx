import { ScrollArea } from '@mantine/core';
import { moveToString } from '../../packages/tak-core/move';
import type { GameUI } from '../../packages/tak-core/ui';
import { useEffect, useRef } from 'react';
import { gameResultToString } from '../../packages/tak-core/game';
import { useGameHistory } from '../../features/history';
export function History({
  game,
  onSetPlyIndex,
}: {
  game: GameUI;
  onSetPlyIndex: (plyIndex: number) => void;
}) {
  const result = useGameHistory(game);

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
              onSetPlyIndex(index - 1);
            } else {
              onSetPlyIndex(index);
            }
          }}
        >
          <span className="font-bold">{move}</span>
        </button>
      </div>
    );
  };

  const rows = result.map(({ white: whiteMove, black: blackMove }, index) => (
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
    <div className="flex flex-col rounded-md p-2 justify-center w-full h-0 grow">
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
