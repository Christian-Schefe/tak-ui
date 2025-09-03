import { createFileRoute } from '@tanstack/react-router';
import {
  ui,
  type Coord,
  type Move,
  type PieceVariant,
} from '../../../packages/tak-core';
import { useSettings } from '../../../settings';
import { Board2D } from '../../../components/board2d/Board2D';
import { Board3D } from '../../../components/board3d/Board3D';
import { GameOverDialog } from '../../../components/dialogs/GameOverDialog';
import { BoardNinja } from '../../../components/boardNinja/BoardNinja';
import { useMemo, useRef } from 'react';
import type { GameCallbacks } from '../../../components/board';
import {
  modifyLocalGame,
  useLocalGameState,
} from '../../../features/localGame';

export const Route = createFileRoute('/_app/_authenticated/scratch')({
  component: RouteComponent,
});

function RouteComponent() {
  const game = useLocalGameState((state) => state.game);

  const { boardType } = useSettings();
  const playerInfo = {
    white: { username: 'Player1', rating: 1500 },
    black: { username: 'Player2', rating: 1600 },
  };

  const gameCallbacks = useMemo(() => {
    const onClickTile = (pos: Coord, variant: PieceVariant) => {
      modifyLocalGame((draft) => {
        ui.tryPlaceOrAddToPartialMove(draft, pos, variant);
      });
    };

    const onMakeMove = (move: Move) => {
      modifyLocalGame((draft) => {
        if (!ui.canDoMove(draft, move)) {
          console.error('Invalid move:', move);
          return;
        }
        console.log('doing move', move);
        ui.doMove(draft, move);
      });
    };
    const onTimeout = () => {
      modifyLocalGame((draft) => {
        ui.checkTimeout(draft);
      });
    };
    const goToPly = (index: number | null) => {
      modifyLocalGame((draft) => {
        ui.setPlyIndex(draft, index);
      });
    };
    const doResign = () => {
      modifyLocalGame((draft) => {
        ui.doResign(draft, draft.actualGame.currentPlayer);
      });
    };
    const callbacks: GameCallbacks = {
      onTimeout,
      onClickTile,
      onMakeMove,
      goToPly,
      sendDrawOffer: () => {
        void 0;
      },
      sendUndoOffer: () => {
        void 0;
      },
      doResign,
    };
    return callbacks;
  }, []);

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
        playerInfo={playerInfo}
        callbacks={currentCallbacks}
        mode={{ type: 'local', review: false }}
      />
      <GameOverDialog game={game} playerInfo={playerInfo} />
    </div>
  );
}
