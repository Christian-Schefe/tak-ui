import { useEffect, useState } from 'react';
import type { GameUI } from '../packages/tak-core/ui';
import type { PlayerInfo } from './board';
import type { Player } from '../packages/tak-core';
import { Affix, Modal, Button, Transition } from '@mantine/core';

export function GameOverDialog({
  game,
  playerInfo,
}: {
  game: GameUI;
  playerInfo: Record<Player, PlayerInfo>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(game.actualGame.gameState.type !== 'ongoing');
  }, [game.actualGame.gameState]);

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        title="Game Over"
        centered
      >
        <p className="text-center">
          {(() => {
            switch (game.actualGame.gameState.type) {
              case 'win':
                return `${playerInfo[game.actualGame.gameState.player].username} wins by ${game.actualGame.gameState.reason}`;
              case 'draw':
                return `It's a draw by ${game.actualGame.gameState.reason}`;
              case 'ongoing':
                return 'Game is ongoing';
            }
          })()}
        </p>
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
