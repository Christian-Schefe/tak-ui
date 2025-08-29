import { ScrollArea } from '@mantine/core';
import type { MoveRecord, Player } from '../../packages/tak-core';
import { moveToString } from '../../packages/tak-core/move';
import type { GameUI } from '../../packages/tak-core/ui';
import { useSettings } from '../../settings';
import { useEffect, useRef } from 'react';
import { FaFlag, FaHandshake, FaUndo } from 'react-icons/fa';
import { gameResultToString } from '../../packages/tak-core/game';
import { useGameHistory } from '../../features/history';
import { useGameOffer } from '../../features/gameOffers';
import type { BoardMode, GameCallbacks } from '../board';

export function History({
  game,
  mode,
  hasDrawOffer,
  hasUndoOffer,
  callbacks,
}: {
  game: GameUI;
  mode: BoardMode;
  hasDrawOffer?: boolean;
  hasUndoOffer?: boolean;
  callbacks: React.RefObject<GameCallbacks>;
}) {
  const { themeParams } = useSettings();

  const {
    hasOfferedDraw,
    hasOfferedUndo,
    setHasOfferedDraw,
    setHasOfferedUndo,
  } = useGameOffer(mode.type === 'local' ? '' : mode.gameId, callbacks);

  const result = useGameHistory(game);

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
              callbacks.current.goToPly(index - 1);
            } else {
              callbacks.current.goToPly(index);
            }
          }}
        >
          <span className="font-bold">{moveToString(move)}</span>
        </button>
      </div>
    );
  };

  const rows = result.map(({ white: whiteMove, black: blackMove }, index) => (
    <div key={`move-${index.toString()}`} className="flex gap-2 p-1 font-mono">
      <div className="w-8">{index + 1}.</div>
      {whiteMove ? makeHistoryItem(index * 2 + 1, 'white', whiteMove) : null}
      {blackMove ? makeHistoryItem(index * 2 + 2, 'black', blackMove) : null}
    </div>
  ));

  if (game.actualGame.gameState.type !== 'ongoing') {
    rows.push(
      <div key={'move-end'} className="flex gap-2 p-1 font-mono">
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
    <div
      className="flex flex-col rounded-md p-2 m-2 justify-center lg:ml-4 lg:w-72 lg:h-128"
      style={{ color: themeParams.text, backgroundColor: themeParams.board1 }}
    >
      {mode.type === 'remote' && (
        <div className="flex gap-2">
          {hasUndoOffer !== undefined && (
            <FaUndo
              className="m-2 hover:outline-2 rounded-md p-1 cursor-pointer"
              style={{
                color: hasUndoOffer
                  ? themeParams.piece1.background
                  : hasOfferedUndo
                    ? themeParams.piece2.background
                    : themeParams.text,
              }}
              size={32}
              onClick={() => {
                setHasOfferedUndo(!hasOfferedUndo);
              }}
            />
          )}
          {hasDrawOffer !== undefined && (
            <FaHandshake
              className="m-2 hover:outline-2 rounded-md p-1 cursor-pointer"
              style={{
                color: hasDrawOffer
                  ? themeParams.piece1.background
                  : hasOfferedDraw
                    ? themeParams.piece2.background
                    : themeParams.text,
              }}
              size={32}
              onClick={() => {
                setHasOfferedDraw(!hasOfferedDraw);
              }}
            />
          )}
          <FaFlag
            className="m-2 hover:outline-2 rounded-md p-1 cursor-pointer"
            size={32}
            onClick={() => {
              callbacks.current.doResign();
            }}
          />
        </div>
      )}
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
