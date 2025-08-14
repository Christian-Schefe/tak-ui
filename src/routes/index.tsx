import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ui } from '../packages/tak-core';
import { newGame } from '../packages/tak-core/game';
import { defaultReserve } from '../packages/tak-core/piece';
import { Board3D } from '../components/board3d/Board3D';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [game, _setGame] = useState<ui.GameUI>(
    ui.newGameUI(
      newGame({ boardSize: 5, komi: 2, reserve: defaultReserve(5) }),
    ),
  );
  return (
    <div className="w-full grow flex flex-col">
      <Board3D
        game={game}
        interactive={true}
        playerInfo={{
          white: { username: 'Player1', rating: 1500 },
          black: { username: 'Player2', rating: 1600 },
        }}
      />
    </div>
  );
}
