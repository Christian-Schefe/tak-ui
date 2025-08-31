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
} from 'react-icons/fa6';
import { Button, Transition, useMantineTheme } from '@mantine/core';
import { History } from './History';
import { useGameOffer } from '../../features/gameOffers';

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
