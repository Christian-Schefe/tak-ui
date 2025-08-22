import { createFileRoute } from '@tanstack/react-router';
import { useImmer } from 'use-immer';
import { ui, type Coord, type PieceVariant } from '../../../packages/tak-core';
import { newGame } from '../../../packages/tak-core/game';
import { defaultReserve } from '../../../packages/tak-core/piece';
import { useSettings } from '../../../settings';
import { Board2D } from '../../../components/board2d/Board2D';
import { Board3D } from '../../../components/board3d/Board3D';
import { GameOverDialog } from '../../../components/GameOverDialog';

export const Route = createFileRoute('/_app/_authenticated/scratch')({
  component: RouteComponent,
});

function RouteComponent() {
  const [game, setGame] = useImmer<ui.GameUI>(
    ui.newGameUI(
      newGame({
        boardSize: 6,
        komi: 2,
        reserve: defaultReserve(7),
        clock: {
          contingentMs: 300000,
          incrementMs: 5000,
          extra: { move: 5, amountMs: 100000 },
        },
      }),
    ),
  );
  const { boardType } = useSettings();
  const playerInfo = {
    white: { username: 'Player1', rating: 1500 },
    black: { username: 'Player2', rating: 1600 },
  };

  const onClickTile = (pos: Coord, variant: PieceVariant) => {
    setGame((draft) => {
      ui.tryPlaceOrAddToPartialMove(draft, pos, variant);
    });
  };

  return (
    <div className="w-full grow flex flex-col">
      {boardType === '2d' && (
        <Board2D
          game={game}
          setGame={setGame}
          playerInfo={playerInfo}
          interactive={true}
          onClickTile={onClickTile}
        />
      )}
      {boardType === '3d' && (
        <Board3D
          game={game}
          setGame={setGame}
          playerInfo={playerInfo}
          interactive={true}
          onClickTile={onClickTile}
        />
      )}
      <GameOverDialog game={game} playerInfo={playerInfo} />
    </div>
  );
}
