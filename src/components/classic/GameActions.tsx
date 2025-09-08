import { ActionIcon, Popover } from '@mantine/core';
import {
  FaArrowRotateLeft,
  FaFlag,
  FaHandshake,
  FaInfo,
} from 'react-icons/fa6';
import { useGameOffer } from '../../features/gameOffers';
import { useRemoteGame } from '../../features/remoteGame';
import type { GameState } from '../../packages/tak-core';
import type { BoardMode, GameCallbacks } from '../board';
import type { GameUI } from '../../packages/tak-core/ui';
import { formatDuration } from '../../features/utils';

export function GameActions({
  mode,
  callbacks,
  game,
  padding,
  gameState,
}: {
  mode: BoardMode;
  game: GameUI;
  gameState: GameState;
  callbacks: React.RefObject<GameCallbacks>;
  padding?: string;
}) {
  const actions = (() => {
    switch (mode.type) {
      case 'local':
        return mode.review ? null : (
          <LocalGameActions callbacks={callbacks} gameState={gameState} />
        );
      case 'remote':
        return (
          <RemoteGameActions
            gameId={mode.gameId}
            callbacks={callbacks}
            gameState={gameState}
          />
        );
      case 'spectator':
        return null;
    }
  })();
  return (
    <div className="flex gap-2" style={{ padding: padding }}>
      <GameInfoButton game={game} />
      {actions}
    </div>
  );
}

function GameInfoButton({ game }: { game: GameUI }) {
  const clockText = game.actualGame.settings.clock
    ? `Clock: ${formatDuration(game.actualGame.settings.clock.contingentMs)} + ${formatDuration(game.actualGame.settings.clock.incrementMs)}`
    : null;

  const extraText = game.actualGame.settings.clock?.extra
    ? `Extra time: ${formatDuration(game.actualGame.settings.clock.extra.amountMs)} at move ${game.actualGame.settings.clock.extra.move.toString()}`
    : null;

  return (
    <Popover>
      <Popover.Target>
        <ActionIcon>
          <FaInfo />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <div>
          <p>Komi: {game.actualGame.settings.halfKomi / 2}</p>
          <p>
            Reserve: {game.actualGame.settings.reserve.pieces}/
            {game.actualGame.settings.reserve.capstones}
          </p>
          {clockText !== null && <p>{clockText}</p>}
          {extraText !== null && <p>{extraText}</p>}
        </div>
      </Popover.Dropdown>
    </Popover>
  );
}

export function LocalGameActions({
  callbacks,
  gameState,
}: {
  gameState: GameState;
  callbacks: React.RefObject<GameCallbacks>;
}) {
  return (
    <>
      <ActionIcon
        onClick={() => {
          callbacks.current.sendUndoOffer(true);
        }}
        disabled={gameState.type !== 'ongoing'}
      >
        <FaArrowRotateLeft />
      </ActionIcon>
      <ActionIcon
        onClick={() => {
          callbacks.current.doResign();
        }}
        disabled={gameState.type !== 'ongoing'}
      >
        <FaFlag />
      </ActionIcon>
    </>
  );
}

export function RemoteGameActions({
  gameId,
  gameState,
  callbacks,
}: {
  gameId: string;
  gameState: GameState;
  callbacks: React.RefObject<GameCallbacks>;
}) {
  const {
    hasOfferedDraw,
    hasOfferedUndo,
    setHasOfferedDraw,
    setHasOfferedUndo,
  } = useGameOffer(gameId, callbacks);

  const { drawOffer, undoOffer } = useRemoteGame(gameId) ?? {
    drawOffer: false,
    undoOffer: false,
  };

  return (
    <>
      <ActionIcon
        onClick={() => {
          setHasOfferedUndo(!hasOfferedUndo);
        }}
        disabled={gameState.type !== 'ongoing'}
        color={undoOffer ? 'green' : hasOfferedUndo ? 'red' : undefined}
      >
        <FaArrowRotateLeft />
      </ActionIcon>

      <ActionIcon
        onClick={() => {
          setHasOfferedDraw(!hasOfferedDraw);
        }}
        disabled={gameState.type !== 'ongoing'}
        color={drawOffer ? 'green' : hasOfferedDraw ? 'red' : undefined}
      >
        <FaHandshake />
      </ActionIcon>
      <ActionIcon
        onClick={() => {
          callbacks.current.doResign();
        }}
        disabled={gameState.type !== 'ongoing'}
      >
        <FaFlag />
      </ActionIcon>
    </>
  );
}
