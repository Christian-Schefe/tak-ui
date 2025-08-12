import { createFileRoute } from '@tanstack/react-router';
import { Board2D } from '../components/board2d/Board2D';
import { useState } from 'react';
import { ui } from '../packages/tak-core';
import { newGame } from '../packages/tak-core/game';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [game, _setGame] = useState<ui.GameUI>(ui.newGameUI(newGame(5, 2)));
  return (
    <div className="w-full grow flex flex-col">
      <Board2D game={game} />
    </div>
  );
}
