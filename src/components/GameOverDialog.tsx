import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import type { GameUI } from '../packages/tak-core/ui';
import type { PlayerInfo } from './board';
import type { Player } from '../packages/tak-core';

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
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
      }}
      className="p-4 rounded-lg flex flex-col gap-2"
    >
      <h1 className="font-bold text-lg text-center mb-2">Game Over</h1>
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
  );
}
