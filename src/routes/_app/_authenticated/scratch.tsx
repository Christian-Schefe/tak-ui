import { createFileRoute } from '@tanstack/react-router';
import { useImmer } from 'use-immer';
import {
  ui,
  type Coord,
  type Move,
  type PieceVariant,
} from '../../../packages/tak-core';
import { newGame } from '../../../packages/tak-core/game';
import { defaultReserve } from '../../../packages/tak-core/piece';
import { useSettings } from '../../../settings';
import { Board2D } from '../../../components/board2d/Board2D';
import { Board3D } from '../../../components/board3d/Board3D';
import { GameOverDialog } from '../../../components/GameOverDialog';
import { BoardNinja } from '../../../components/boardNinja/BoardNinja';
import { useMemo, useRef } from 'react';

export const Route = createFileRoute('/_app/_authenticated/scratch')({
  component: RouteComponent,
});

function RouteComponent() {
  const [game, setGame] = useImmer<ui.GameUI>(
    ui.newGameUI(
      newGame({
        boardSize: 6,
        halfKomi: 4,
        reserve: defaultReserve(7),
      }),
    ),
  );
  const { boardType } = useSettings();
  const playerInfo = {
    white: { username: 'Player1', rating: 1500 },
    black: { username: 'Player2', rating: 1600 },
  };

  const gameCallbacks = useMemo(() => {
    const onClickTile = (pos: Coord, variant: PieceVariant) => {
      setGame((draft) => {
        ui.tryPlaceOrAddToPartialMove(draft, pos, variant);
      });
    };

    const onMakeMove = (move: Move) => {
      setGame((draft) => {
        if (!ui.canDoMove(draft, move)) {
          console.error('Invalid move:', move);
          return;
        }
        console.log('doing move', move);
        ui.doMove(draft, move);
      });
    };
    const onTimeout = () => {
      setGame((draft) => {
        ui.checkTimeout(draft);
      });
    };
    return { onTimeout, onClickTile, onMakeMove };
  }, [setGame]);

  const currentCallbacks = useRef(gameCallbacks);
  useMemo(() => {
    currentCallbacks.current = gameCallbacks;
  }, [gameCallbacks]);

  const BoardComponent =
    boardType === '2d' ? Board2D : boardType === '3d' ? Board3D : BoardNinja;

  return (
    <div className="w-full grow flex flex-col">
      <BoardComponent
        game={game}
        setGame={setGame}
        playerInfo={playerInfo}
        callbacks={currentCallbacks}
        mode={{ type: 'local' }}
      />
      <GameOverDialog game={game} playerInfo={playerInfo} />
    </div>
  );
}
