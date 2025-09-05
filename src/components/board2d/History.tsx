import { ActionIcon, ScrollArea } from '@mantine/core';
import type { MoveRecord, Player } from '../../packages/tak-core';
import { moveToString } from '../../packages/tak-core/move';
import type { GameUI } from '../../packages/tak-core/ui';
import { useSettings } from '../../settings';
import { useEffect, useRef } from 'react';
import {
  FaAngleLeft,
  FaAngleRight,
  FaAnglesLeft,
  FaAnglesRight,
} from 'react-icons/fa6';
import { gameResultToString } from '../../packages/tak-core/game';
import { useGameHistory, useHistoryNavigation } from '../../features/history';
import type { BoardMode, GameCallbacks } from '../board';
import { useEvent } from 'react-use';
import { GameActions } from '../classic/GameInfoDrawer';
import { motion } from 'motion/react';

export function History({
  game,
  mode,
  callbacks,
}: {
  game: GameUI;
  mode: BoardMode;
  callbacks: React.RefObject<GameCallbacks>;
}) {
  const { themeParams, boardSettings } = useSettings();

  const result = useGameHistory(game);

  const {
    increasePlyIndex,
    decreasePlyIndex,
    goToFirstPly,
    goToLastPly,
    onArrowKey,
  } = useHistoryNavigation(game, callbacks);

  useEvent('keydown', onArrowKey);

  const makeHistoryItem = (index: number, player: Player, move: MoveRecord) => {
    const colors =
      (player === 'white') === index > 2
        ? themeParams.piece1
        : themeParams.piece2;
    return (
      <motion.div
        className="min-w-12"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: boardSettings.board2d.animationSpeed / 1000 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          className="text-left rounded-md px-1"
          style={{
            width: '100%',
            backgroundColor: colors.background,
            color: colors.text ?? colors.border,
            opacity: game.plyIndex !== null && game.plyIndex < index ? 0.5 : 1,
            transition: 'opacity 150ms ease-in-out',
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
      </motion.div>
    );
  };

  const rows = result.map(({ white: whiteMove, black: blackMove }, index) => (
    <div
      key={`move-${index.toString()}`}
      className="flex gap-2 p-1 font-mono text-nowrap"
    >
      <motion.div
        className="w-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: boardSettings.board2d.animationSpeed / 1000 }}
      >
        {index + 1}.
      </motion.div>
      {whiteMove ? makeHistoryItem(index * 2 + 1, 'white', whiteMove) : null}
      {blackMove ? makeHistoryItem(index * 2 + 2, 'black', blackMove) : null}
    </div>
  ));

  if (game.actualGame.gameState.type !== 'ongoing') {
    rows.push(
      <div key={'move-end'} className="flex gap-2 p-1 font-mono text-nowrap">
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
      className="flex flex-col rounded-md p-2 m-2 justify-center lg:w-72 lg:max-h-200 h-full"
      style={{ color: themeParams.text, backgroundColor: themeParams.board1 }}
    >
      <GameActions
        mode={mode}
        callbacks={callbacks}
        padding="0.5rem"
        gameState={game.actualGame.gameState}
      />
      <ScrollArea
        viewportRef={viewport}
        className="grow"
        overscrollBehavior="contain"
      >
        <div className="flex lg:flex-col">{rows}</div>
      </ScrollArea>
      <div className="flex justify-center p-2 gap-2">
        <ActionIcon
          onClick={() => {
            goToFirstPly();
          }}
        >
          <FaAnglesLeft />
        </ActionIcon>
        <ActionIcon
          onClick={() => {
            decreasePlyIndex();
          }}
        >
          <FaAngleLeft />
        </ActionIcon>
        <ActionIcon
          onClick={() => {
            increasePlyIndex();
          }}
        >
          <FaAngleRight />
        </ActionIcon>
        <ActionIcon
          onClick={() => {
            goToLastPly();
          }}
        >
          <FaAnglesRight />
        </ActionIcon>
      </div>
    </div>
  );
}
