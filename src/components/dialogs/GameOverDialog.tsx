import { useEffect, useMemo, useState } from 'react';
import type { GameUI } from '../../packages/tak-core/ui';
import type { PlayerInfo } from '../board';
import type { Player } from '../../packages/tak-core';
import { Affix, Modal, Button, Transition, CopyButton } from '@mantine/core';
import { FaCopy, FaLink, FaTrophy } from 'react-icons/fa6';
import { gameToPTN } from '../../packages/tak-core/ptn';

export function GameOverDialog({
  game,
  gameId,
  playerInfo,
}: {
  game: GameUI;
  gameId?: string;
  playerInfo: Record<Player, PlayerInfo>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(game.actualGame.gameState.type !== 'ongoing');
  }, [game.actualGame.gameState]);

  const ptn = useMemo(
    () =>
      gameToPTN(game.actualGame, {
        white: playerInfo.white.username,
        black: playerInfo.black.username,
      }),
    [game.actualGame, playerInfo],
  );

  const onClickOpenInPTNNinja = () => {
    const ptn = gameToPTN(game.actualGame, {
      white: playerInfo.white.username,
      black: playerInfo.black.username,
    });
    window.open(`https://ptn.ninja/${encodeURIComponent(ptn)}`, '_blank');
  };

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        title={
          <div className="flex gap-2 items-center font-bold text-lg">
            <FaTrophy size={20} />
            Game Over
          </div>
        }
        centered
      >
        <div className="flex flex-col gap-4 items-center">
          <div className="text-center">
            {(() => {
              switch (game.actualGame.gameState.type) {
                case 'win':
                  return (
                    <p>
                      <span className="font-bold">
                        {playerInfo[game.actualGame.gameState.player].username}
                      </span>{' '}
                      wins by {game.actualGame.gameState.reason}
                    </p>
                  );
                case 'draw':
                  return (
                    <p>It's a draw by {game.actualGame.gameState.reason}</p>
                  );
                case 'ongoing':
                  return <p>Game is ongoing</p>;
              }
            })()}
          </div>
          <div className="flex flex-col gap-4">
            {gameId !== undefined && (
              <CopyButton value={gameId}>
                {({ copy, copied }) => (
                  <Button
                    leftSection={<FaCopy />}
                    color={copied ? 'green' : undefined}
                    onClick={copy}
                  >
                    {copied ? 'Copied!' : 'Copy Game Id'}
                  </Button>
                )}
              </CopyButton>
            )}
            <CopyButton value={ptn}>
              {({ copy, copied }) => (
                <Button
                  leftSection={<FaCopy />}
                  onClick={copy}
                  color={copied ? 'green' : undefined}
                >
                  {copied ? 'Copied!' : 'Copy PTN'}
                </Button>
              )}
            </CopyButton>
            <Button leftSection={<FaLink />} onClick={onClickOpenInPTNNinja}>
              Open in PTN Ninja
            </Button>
          </div>
        </div>
      </Modal>
      <Affix
        position={{ top: 50, left: '50%' }}
        style={{ transform: 'translateX(-50%)' }}
        zIndex={100}
      >
        <Transition
          transition="slide-down"
          mounted={!isOpen && game.actualGame.gameState.type !== 'ongoing'}
        >
          {(transitionStyles) => (
            <Button
              style={transitionStyles}
              onClick={() => {
                setIsOpen(true);
              }}
            >
              Open Game Over Info
            </Button>
          )}
        </Transition>
      </Affix>
    </>
  );
}
