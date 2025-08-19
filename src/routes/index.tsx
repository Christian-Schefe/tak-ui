import { createFileRoute } from '@tanstack/react-router';
import { ui } from '../packages/tak-core';
import { newGame } from '../packages/tak-core/game';
import { defaultReserve } from '../packages/tak-core/piece';
import { Board3D } from '../components/board3d/Board3D';
import { useImmer } from 'use-immer';
import { Board2D } from '../components/board2d/Board2D';
import { useSettings } from '../settings';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [game, setGame] = useImmer<ui.GameUI>(
    ui.newGameUI(
      newGame({
        boardSize: 6,
        komi: 2,
        reserve: defaultReserve(7),
        clock: { contingent: 300000, increment: 5000 },
      }),
    ),
  );
  const { boardType } = useSettings();
  const playerInfo = {
    white: { username: 'Player1', rating: 1500 },
    black: { username: 'Player2', rating: 1600 },
  };
  return (
    <div className="w-full grow flex flex-col">
      {boardType === '2d' && (
        <Board2D
          game={game}
          setGame={setGame}
          playerInfo={playerInfo}
          interactive={true}
        />
      )}
      {boardType === '3d' && (
        <Board3D
          game={game}
          setGame={setGame}
          playerInfo={playerInfo}
          interactive={true}
        />
      )}
    </div>
  );
}
