import { useDisclosure } from '@mantine/hooks';
import type { GameUI } from '../../packages/tak-core/ui';
import { PlayerInfoBar } from './PlayerInfoBar';
import type { BoardMode, GameCallbacks, PlayerInfo } from '../board';
import type { Player } from '../../packages/tak-core';
import {
  FaArrowLeft,
  FaArrowRight,
  FaAnglesLeft,
  FaAnglesRight,
  FaAngleLeft,
  FaAngleRight,
} from 'react-icons/fa6';
import { ActionIcon, Button, Transition } from '@mantine/core';
import { History } from './History';
import { useEvent } from 'react-use';
import { useHistoryNavigation } from '../../features/history';
import { GameActions } from './GameActions';

export function GameInfoDrawer({
  game,
  mode,
  playerInfo,
  callbacks,
}: {
  game: GameUI;
  mode: BoardMode;
  playerInfo: Record<Player, PlayerInfo>;
  callbacks: React.RefObject<GameCallbacks>;
}) {
  const [isSideOpen, { toggle: toggleSide }] = useDisclosure(true);

  const {
    increasePlyIndex,
    decreasePlyIndex,
    goToFirstPly,
    goToLastPly,
    onArrowKey,
  } = useHistoryNavigation(game, callbacks);

  useEvent('keydown', onArrowKey);

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
              <GameActions
                mode={mode}
                game={game}
                callbacks={callbacks}
                gameState={game.actualGame.gameState}
              />
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
