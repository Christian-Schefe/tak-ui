import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ui,
  type Coord,
  type Move,
  type PieceVariant,
} from '../packages/tak-core';
import { offsetCoord } from '../packages/tak-core/coord';
import { Board3D } from './board3d/Board3D';
import { useAuth, useWSAPI } from '../authHooks';
import { useSettings } from '../settings';
import { Board2D } from './board2d/Board2D';
import { GameOverDialog } from './dialogs/GameOverDialog';
import { notifications } from '@mantine/notifications';
import { ReadyState } from 'react-use-websocket';
import type { BoardMode } from './board';
import { BoardNinja } from './boardNinja/BoardNinja';
import { useRatings } from '../api/ratings';
import type { GameListEntry } from '../features/gameList';
import {
  modifyRemoteGame,
  useRemoteGame,
  useRemoteGameState,
} from '../features/remoteGame';
import { usePlayMoveSound } from '../packages/tak-core/hooks';

export function PlayedGame({
  observed,
  gameEntry,
}: {
  observed: boolean;
  gameEntry: GameListEntry;
}) {
  const gameId = useMemo(() => gameEntry.id.toString(), [gameEntry.id]);
  const { user, isAuthenticated } = useAuth();

  const ratings = useRatings([gameEntry.white, gameEntry.black]);

  const playerInfo = {
    white: {
      username: gameEntry.white,
      rating: ratings[gameEntry.white]?.rating,
    },
    black: {
      username: gameEntry.black,
      rating: ratings[gameEntry.black]?.rating,
    },
  };

  const boardMode: BoardMode = useMemo(() => {
    if (observed) return { type: 'spectator', gameId };
    if (user?.username === gameEntry.white)
      return { type: 'remote', localPlayer: 'white', gameId };
    if (user?.username === gameEntry.black)
      return { type: 'remote', localPlayer: 'black', gameId };
    return { type: 'spectator', gameId };
  }, [observed, user?.username, gameEntry.white, gameEntry.black, gameId]);

  const { sendMessage, readyState } = useWSAPI();

  const game = useRemoteGame(gameId);

  const { devMode, volume, boardType } = useSettings();
  const showNotifications = useRef(devMode.value);
  useEffect(() => {
    showNotifications.current = devMode.value;
  }, [devMode.value]);

  useEffect(() => {
    if (observed && readyState === ReadyState.OPEN && isAuthenticated) {
      console.log('Subscribing to game:', gameId);
      sendMessage(`Observe ${gameId}`);
      if (showNotifications.current) {
        notifications.show({
          title: 'Subscribing to game',
          message: `Subscribing to game: ${gameId}`,
          position: 'top-right',
        });
      }

      return () => {
        console.log('Unsubscribing from game:', gameId);
        sendMessage(`Unobserve ${gameId}`, false);
        if (showNotifications.current) {
          notifications.show({
            title: 'Unsubscribing from game',
            message: `Unsubscribing from game: ${gameId}`,
            position: 'top-right',
          });
        }
      };
    }
  }, [observed, readyState, gameId, sendMessage, isAuthenticated]);

  useEffect(() => {
    if (observed && readyState === ReadyState.OPEN && isAuthenticated) {
      const roomId = [gameEntry.white, gameEntry.black].sort().join('-');
      sendMessage(`JoinRoom ${roomId}`);

      return () => {
        sendMessage(`LeaveRoom ${roomId}`, false);
      };
    }
  }, [
    observed,
    gameEntry.white,
    gameEntry.black,
    readyState,
    sendMessage,
    isAuthenticated,
  ]);

  const sendMoveMessage = useCallback(
    (move: Move) => {
      if (move.type === 'place') {
        const col = String.fromCharCode(move.pos.x + 'A'.charCodeAt(0));
        const row = move.pos.y + 1;
        const variant =
          move.variant === 'capstone'
            ? ' C'
            : move.variant === 'standing'
              ? ' W'
              : '';
        sendMessage(`Game#${gameId} P ${col}${row.toString()}${variant}`);
      } else {
        const fromCol = String.fromCharCode(move.from.x + 'A'.charCodeAt(0));
        const fromRow = move.from.y + 1;
        const to = offsetCoord(move.from, move.dir, move.drops.length);
        const toCol = String.fromCharCode(to.x + 'A'.charCodeAt(0));
        const toRow = to.y + 1;
        const drops = move.drops.join(' ');
        sendMessage(
          `Game#${gameId} M ${fromCol}${fromRow.toString()} ${toCol}${toRow.toString()} ${drops}`,
        );
      }
    },
    [gameId, sendMessage],
  );

  const gameCallbacks = useMemo(() => {
    const onClickTile = (pos: Coord, variant: PieceVariant) => {
      if (observed) return;
      if (
        boardMode.type !== 'remote' ||
        !game ||
        game.game.actualGame.currentPlayer !== boardMode.localPlayer ||
        game.game.actualGame.gameState.type !== 'ongoing'
      ) {
        throw new Error('not your turn');
      }
      modifyRemoteGame(gameId, (draft) => {
        const move = ui.tryPlaceOrAddToPartialMove(draft, pos, variant);
        //TODO: react strict mode causes duplicated send.
        if (move) {
          sendMoveMessage(move);
        }
      });
    };

    const onMakeMove = (move: Move) => {
      console.log('on make move', move);
      if (observed) return;
      if (
        boardMode.type !== 'remote' ||
        !game ||
        game.game.actualGame.currentPlayer !== boardMode.localPlayer ||
        game.game.actualGame.gameState.type !== 'ongoing'
      ) {
        throw new Error('not your turn');
      }
      modifyRemoteGame(gameId, (draft) => {
        if (!ui.canDoMove(draft, move)) {
          console.error('Invalid move:', move);
          return;
        }
        console.log('doing move', move);
        ui.doMove(draft, move);
        //TODO: react strict mode causes duplicated send.
        sendMoveMessage(move);
      });
    };

    const onTimeout = () => {
      modifyRemoteGame(gameId, (draft) => {
        ui.checkTimeout(draft);
      });
    };
    const goToPly = (index: number | null) => {
      modifyRemoteGame(gameId, (draft) => {
        ui.setPlyIndex(draft, index);
      });
    };
    const sendDrawOffer = (offer: boolean) => {
      sendMessage(`Game#${gameId} ${offer ? 'Offer' : 'Remove'}Draw`);
    };
    const sendUndoOffer = (offer: boolean) => {
      sendMessage(`Game#${gameId} ${offer ? 'Request' : 'Remove'}Undo`);
    };
    const doResign = () => {
      sendMessage(`Game#${gameId} Resign`);
    };
    return {
      onTimeout,
      onClickTile,
      onMakeMove,
      goToPly,
      sendDrawOffer,
      sendUndoOffer,
      doResign,
    };
  }, [boardMode, game, gameId, sendMessage, observed, sendMoveMessage]);

  const currentCallbacks = useRef(gameCallbacks);
  useEffect(() => {
    currentCallbacks.current = gameCallbacks;
  }, [gameCallbacks]);

  usePlayMoveSound('/audio/move.mp3', game?.game, volume.value);

  if (!game) {
    console.warn(
      'No game found for id. This should not happen',
      gameId,
      Object.entries(useRemoteGameState.getState().games).filter(
        ([_k, v]) => v !== undefined,
      ),
    );
    return <div>No game found. Try refreshing the page.</div>;
  }

  const BoardComponent =
    boardType === '2d' ? Board2D : boardType === '3d' ? Board3D : BoardNinja;

  return (
    <div className="w-full grow flex flex-col">
      <BoardComponent
        game={game.game}
        playerInfo={playerInfo}
        mode={boardMode}
        callbacks={currentCallbacks}
      />
      <GameOverDialog
        game={game.game}
        playerInfo={playerInfo}
        gameId={gameId}
      />
    </div>
  );
}
