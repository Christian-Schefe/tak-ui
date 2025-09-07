import { useEffect, useMemo, useState } from 'react';
import type { GameUI } from '../../packages/tak-core/ui';
import type { BoardMode, PlayerInfo } from '../board';
import type { Player } from '../../packages/tak-core';
import { Affix, Modal, Button, Transition, CopyButton } from '@mantine/core';
import { FaArrowRotateLeft, FaCopy, FaLink, FaTrophy } from 'react-icons/fa6';
import { gameToPTN } from '../../packages/tak-core/ptn';
import { useNavigate } from '@tanstack/react-router';
import { LuExternalLink } from 'react-icons/lu';
import { rematchLocalGame } from '../../features/localGame';

export function GameOverDialog({
  mode,
  game,
  playerInfo,
}: {
  game: GameUI;
  mode: BoardMode;
  playerInfo: Record<Player, PlayerInfo>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(game.actualGame.gameState.type !== 'ongoing');
  }, [game.actualGame.gameState]);

  const navigate = useNavigate();

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

  const flatDifferenceText =
    (game.actualGame.gameState.type === 'win' ||
      game.actualGame.gameState.type === 'draw') &&
    game.actualGame.gameState.reason === 'flats' &&
    game.actualGame.gameState.counts
      ? ` (${game.actualGame.gameState.counts.white.toString()} to ${game.actualGame.gameState.counts.black.toString()} + ${(game.actualGame.settings.halfKomi / 2).toString()})`
      : '';

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
                      {flatDifferenceText}
                    </p>
                  );
                case 'draw':
                  return (
                    <p>
                      It's a draw by {game.actualGame.gameState.reason}
                      {flatDifferenceText}
                    </p>
                  );
                case 'ongoing':
                  return <p>Game is ongoing</p>;
              }
            })()}
          </div>
          <div className="flex flex-col gap-4">
            {(mode.type !== 'local' || mode.review) && (
              <CopyButton value={mode.gameId}>
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
            <Button
              leftSection={<LuExternalLink />}
              onClick={onClickOpenInPTNNinja}
            >
              Open in PTN Ninja
            </Button>
            {mode.type !== 'local' && (
              <Button
                leftSection={<FaLink />}
                onClick={() => {
                  void navigate({
                    to: '/games/$gameId',
                    params: { gameId: mode.gameId },
                  });
                }}
              >
                Open in Review Board
              </Button>
            )}
            {mode.type === 'local' && !mode.review && (
              <Button
                leftSection={<FaArrowRotateLeft />}
                onClick={() => {
                  rematchLocalGame();
                }}
              >
                Rematch
              </Button>
            )}
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
