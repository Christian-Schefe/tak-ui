import { createFileRoute } from '@tanstack/react-router';
import { ui } from '../packages/tak-core';
import { newGame } from '../packages/tak-core/game';
import { defaultReserve } from '../packages/tak-core/piece';
import { Board3D } from '../components/board3d/Board3D';
import { useImmer } from 'use-immer';
import { Board2D } from '../components/board2d/Board2D';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [game, setGame] = useImmer<ui.GameUI>(
    ui.newGameUI(
      newGame({
        boardSize: 5,
        komi: 2,
        reserve: defaultReserve(5),
        clock: { contingent: 30000, increment: 5000 },
      }),
    ),
  );
  const use3d = true;
  const playerInfo = {
    white: { username: 'Player1', rating: 1500 },
    black: { username: 'Player2', rating: 1600 },
  };
  return (
    <div className="w-full grow flex flex-col">
      {use3d ? (
        <Board3D
          game={game}
          setGame={setGame}
          interactive={true}
          playerInfo={playerInfo}
        />
      ) : (
        <Board2D
          game={game}
          setGame={setGame}
          interactive={true}
          playerInfo={playerInfo}
        />
      )}
    </div>
  );
}
