import { createFileRoute } from '@tanstack/react-router';
import { useGamePTN } from '../../../api/gameDatabase';
import { Loader } from '@mantine/core';
import { PTNToGame } from '../../../packages/tak-core/ptn';
import { useSettings } from '../../../settings';
import { Board2D } from '../../../components/board2d/Board2D';
import { Board3D } from '../../../components/board3d/Board3D';
import { BoardNinja } from '../../../components/boardNinja/BoardNinja';
import { newGameUI } from '../../../packages/tak-core/ui';
import { useEffect, useMemo, useRef } from 'react';
import type { BoardMode, GameCallbacks } from '../../../components/board';
import { GameOverDialog } from '../../../components/dialogs/GameOverDialog';
import { useImmer } from 'use-immer';
import { ui } from '../../../packages/tak-core';

export const Route = createFileRoute('/_app/_authenticated/games/$gameId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { gameId } = Route.useParams();
  const { data: ptn, isLoading } = useGamePTN(gameId);
  const { boardType } = useSettings();

  const parsedGame = useMemo(() => {
    return ptn !== undefined ? PTNToGame(ptn) : null;
  }, [ptn]);

  const [game, setGame] = useImmer<ui.GameUI | null>(null);

  useEffect(() => {
    if (parsedGame && !game) {
      setGame(newGameUI(parsedGame.game));
    }
  }, [parsedGame, game, setGame]);

  const gameCallbacks = useMemo(() => {
    const onClickTile = () => {
      void 0;
    };

    const onDeselect = () => {
      void 0;
    };

    const onMakeMove = () => {
      void 0;
    };
    const onTimeout = () => {
      void 0;
    };
    const goToPly = (index: number | null) => {
      setGame((draft) => {
        if (!draft) return;
        ui.setPlyIndex(draft, index);
      });
    };
    const callbacks: GameCallbacks = {
      onTimeout,
      onClickTile,
      onDeselect,
      onMakeMove,
      goToPly,
      sendDrawOffer: () => {
        void 0;
      },
      sendUndoOffer: () => {
        void 0;
      },
      doResign: () => {
        void 0;
      },
    };
    return callbacks;
  }, [setGame]);

  const currentCallbacks = useRef(gameCallbacks);
  useMemo(() => {
    currentCallbacks.current = gameCallbacks;
  }, [gameCallbacks]);

  const BoardComponent =
    boardType === '2d' ? Board2D : boardType === '3d' ? Board3D : BoardNinja;

  if (isLoading || (parsedGame && !game))
    return (
      <div className="flex justify-center items-center w-full grow">
        <Loader />
      </div>
    );

  if (!game || !parsedGame) return <div>Failed to load game</div>;

  const playerInfo = {
    white: { rating: 1000, ...parsedGame.playerInfo.white },
    black: { rating: 1000, ...parsedGame.playerInfo.black },
  };

  const gameMode: BoardMode = { type: 'local', review: true, gameId };

  return (
    <div className="w-full grow flex flex-col">
      <BoardComponent
        game={game}
        playerInfo={playerInfo}
        callbacks={currentCallbacks}
        mode={gameMode}
      />
      <GameOverDialog game={game} mode={gameMode} playerInfo={playerInfo} />
    </div>
  );
}
