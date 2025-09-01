import { useDisclosure } from '@mantine/hooks';
import type { GameUI } from '../../packages/tak-core/ui';
import { PlayerInfoBar } from './PlayerInfoBar';
import type { GameCallbacks, PlayerInfo } from '../board';
import type { Player } from '../../packages/tak-core';
import {
  FaArrowLeft,
  FaArrowRight,
  FaFlag,
  FaHandshake,
  FaArrowRotateLeft,
  FaAnglesLeft,
  FaAnglesRight,
  FaAngleLeft,
  FaAngleRight,
} from 'react-icons/fa6';
import { ActionIcon, Button, Transition, useMantineTheme } from '@mantine/core';
import { History } from './History';
import { useGameOffer } from '../../features/gameOffers';
import { useEvent } from 'react-use';
import { useCallback } from 'react';

export function GameInfoDrawer({
  gameId,
  game,
  playerInfo,
  hasDrawOffer,
  hasUndoOffer,
  showResign,
  callbacks,
}: {
  gameId?: string;
  game: GameUI;
  playerInfo: Record<Player, PlayerInfo>;
  hasDrawOffer?: boolean;
  hasUndoOffer?: boolean;
  showResign: boolean;
  callbacks: React.RefObject<GameCallbacks>;
}) {
  const [isSideOpen, { toggle: toggleSide }] = useDisclosure(true);

  const {
    hasOfferedDraw,
    hasOfferedUndo,
    setHasOfferedDraw,
    setHasOfferedUndo,
  } = useGameOffer(gameId ?? '', callbacks);

  const theme = useMantineTheme();

  const sentColor = theme.colors.red[6];
  const receivedColor = theme.colors.blue[6];

  const decreasePlyIndex = useCallback(() => {
    const newPlyIndex =
      game.plyIndex !== null
        ? Math.max(0, game.plyIndex - 1)
        : game.actualGame.history.length - 1;
    callbacks.current.goToPly(newPlyIndex);
  }, [game.plyIndex, game.actualGame.history.length, callbacks]);

  const increasePlyIndex = useCallback(() => {
    const newPlyIndex = game.plyIndex !== null ? game.plyIndex + 1 : null;
    callbacks.current.goToPly(newPlyIndex);
  }, [game.plyIndex, callbacks]);

  const onKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target !== null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isTyping) return;

      if (e.key === 'ArrowLeft') {
        decreasePlyIndex();
      } else if (e.key === 'ArrowRight') {
        increasePlyIndex();
      }
    },
    [decreasePlyIndex, increasePlyIndex],
  );

  useEvent('keydown', onKeyUp);

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
            className="flex flex-col grow w-full overflow-hidden"
            style={transitionStyles}
          >
            <PlayerInfoBar
              game={game}
              player="white"
              rating={playerInfo.white.rating}
              username={playerInfo.white.username}
              onTimeout={() => {
                callbacks.current.onTimeout();
              }}
            />
            <PlayerInfoBar
              game={game}
              player="black"
              rating={playerInfo.black.rating}
              username={playerInfo.black.username}
              onTimeout={() => {
                callbacks.current.onTimeout();
              }}
            />
            <div className="flex justify-center">
              {hasUndoOffer !== undefined && (
                <FaArrowRotateLeft
                  className="m-2 hover:outline-2 rounded-md p-1 cursor-pointer"
                  style={{
                    color: hasUndoOffer
                      ? receivedColor
                      : hasOfferedUndo
                        ? sentColor
                        : undefined,
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
                      ? receivedColor
                      : hasOfferedDraw
                        ? sentColor
                        : undefined,
                  }}
                  size={32}
                  onClick={() => {
                    setHasOfferedDraw(!hasOfferedDraw);
                  }}
                />
              )}
              {showResign && (
                <FaFlag
                  className="m-2 hover:outline-2 rounded-md p-1 cursor-pointer"
                  size={32}
                  onClick={() => {
                    callbacks.current.doResign();
                  }}
                />
              )}
            </div>
            <History
              game={game}
              onSetPlyIndex={(index) => {
                callbacks.current.goToPly(index);
              }}
            />
            <div className="flex justify-center p-2 mb-16 gap-2">
              <ActionIcon
                onClick={() => {
                  callbacks.current.goToPly(0);
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
                  callbacks.current.goToPly(null);
                }}
              >
                <FaAnglesRight />
              </ActionIcon>
            </div>
          </div>
        )}
      </Transition>
      <div className="absolute top-10 right-[-25px]">
        <Button onClick={toggleSide} w="25px" h="40px" p="2px">
          {isSideOpen ? <FaArrowLeft /> : <FaArrowRight />}
        </Button>
      </div>
    </div>
  );
}
