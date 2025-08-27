import { useDisclosure } from '@mantine/hooks';
import type { GameUI } from '../../packages/tak-core/ui';
import { PlayerInfoBar } from './PlayerInfoBar';
import type { PlayerInfo } from '../board';
import type { Player } from '../../packages/tak-core';
import {
  FaArrowLeft,
  FaArrowRight,
  FaFlag,
  FaHandshake,
  FaUndo,
} from 'react-icons/fa';
import { Button, Transition, useMantineTheme } from '@mantine/core';
import { History } from './History';
import { useGameOffer } from './remoteActions';

export function GameInfoDrawer({
  gameId,
  game,
  playerInfo,
  onTimeout,
  sendDrawOffer,
  hasDrawOffer,
  hasUndoOffer,
  sendUndoOffer,
  doResign,
  goToPly,
}: {
  gameId?: string;
  game: GameUI;
  playerInfo: Record<Player, PlayerInfo>;
  onTimeout: () => void;
  sendDrawOffer?: (offer: boolean) => void;
  hasDrawOffer?: boolean;
  sendUndoOffer?: (offer: boolean) => void;
  hasUndoOffer?: boolean;
  doResign?: () => void;
  goToPly: (plyIndex: number) => void;
}) {
  const [isSideOpen, { toggle: toggleSide }] = useDisclosure(true);

  const gameOffers = useGameOffer();

  const setHasOfferedDraw = (value: boolean) => {
    gameOffers.setHasOfferedDraw(gameId ?? '', value);
    sendDrawOffer?.(value);
  };

  const setHasOfferedUndo = (value: boolean) => {
    gameOffers.setHasOfferedUndo(gameId ?? '', value);
    sendUndoOffer?.(value);
  };

  const hasOfferedDraw = !!gameOffers.hasOfferedDraw[gameId ?? ''];
  const hasOfferedUndo = !!gameOffers.hasOfferedUndo[gameId ?? ''];

  const theme = useMantineTheme();

  const sentColor = theme.colors.red[6];
  const receivedColor = theme.colors.blue[6];

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
              {sendDrawOffer && (
                <FaUndo
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
              {sendDrawOffer && (
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
