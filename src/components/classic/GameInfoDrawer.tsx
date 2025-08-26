import { useDisclosure } from '@mantine/hooks';
import type { GameUI } from '../../packages/tak-core/ui';
import { PlayerInfoBar } from './PlayerInfoBar';
import type { PlayerInfo } from '../board';
import type { Player } from '../../packages/tak-core';
import { useRef } from 'react';
import { useUpdate } from 'react-use';
import {
  FaArrowLeft,
  FaArrowRight,
  FaFlag,
  FaHandshake,
  FaHandshakeSlash,
} from 'react-icons/fa';
import { Button, Transition } from '@mantine/core';
import { History } from './History';

export function GameInfoDrawer({
  game,
  playerInfo,
  onTimeout,
  sendDrawOffer,
  hasDrawOffer,
  doResign,
  goToPly,
}: {
  game: GameUI;
  playerInfo: Record<Player, PlayerInfo>;
  onTimeout: () => void;
  sendDrawOffer?: (offer: boolean) => void;
  hasDrawOffer?: boolean;
  doResign?: () => void;
  goToPly: (plyIndex: number) => void;
}) {
  const [isSideOpen, { toggle: toggleSide }] = useDisclosure(true);
  const update = useUpdate();
  const hasOfferedDraw = useRef(false);

  const setHasOfferedDraw = (value: boolean) => {
    hasOfferedDraw.current = value;
    sendDrawOffer?.(value);
    update();
  };

  return (
    <div
      className="flex flex-col relative"
      style={{ width: isSideOpen ? '16rem' : '0', transition: 'width 0.2s' }}
    >
      <Transition
        mounted={isSideOpen}
        transition="fade"
        duration={200}
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
              onTimeout={onTimeout}
            />
            <PlayerInfoBar
              game={game}
              player="black"
              rating={playerInfo.black.rating}
              username={playerInfo.black.username}
              onTimeout={onTimeout}
            />
            <div className="flex justify-center">
              {sendDrawOffer &&
                (!hasOfferedDraw.current || hasDrawOffer ? (
                  <FaHandshake
                    className={`m-2 ${hasDrawOffer ? 'hover:outline-3 outline-2' : 'hover:outline-2'} rounded-md p-1 cursor-pointer`}
                    size={32}
                    onClick={() => {
                      setHasOfferedDraw(true);
                    }}
                  />
                ) : (
                  <FaHandshakeSlash
                    className="m-2 hover:outline-2 rounded-md p-1 cursor-pointer"
                    size={32}
                    onClick={() => {
                      setHasOfferedDraw(false);
                    }}
                  />
                ))}
              {doResign && (
                <FaFlag
                  className="m-2 hover:outline-2 rounded-md p-1 cursor-pointer"
                  size={32}
                  onClick={() => {
                    doResign();
                  }}
                />
              )}
            </div>
            <History game={game} onClick={goToPly} />
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
