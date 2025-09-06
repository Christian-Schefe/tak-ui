import { Board3D } from './board3d/Board3D';
import { useSettings } from '../settings';
import { Board2D } from './board2d/Board2D';
import { GameOverDialog } from './dialogs/GameOverDialog';
import type { BoardMode } from './board';
import { BoardNinja } from './boardNinja/BoardNinja';
import { usePlayerInfo, type GameListEntry } from '../features/gameList';
import {
  useRemoteGameCallbacks,
  type GameStateEntry,
} from '../features/remoteGame';
import { usePlayMoveSound } from '../packages/tak-core/hooks';
import { useBoardMode } from '../features/board';

export function RemoteGame({
  observed,
  game,
  gameEntry,
}: {
  observed: boolean;
  game: GameStateEntry;
  gameEntry: GameListEntry;
}) {
  const playerInfo = usePlayerInfo(gameEntry);
  const boardMode: BoardMode = useBoardMode(observed, gameEntry);

  const { volume, boardType } = useSettings();

  const gameCallbacks = useRemoteGameCallbacks(
    boardMode.gameId,
    observed,
    boardMode,
    game,
  );

  usePlayMoveSound('/audio/move.mp3', game.game, volume.value);

  const BoardComponent =
    boardType === '2d' ? Board2D : boardType === '3d' ? Board3D : BoardNinja;

  return (
    <div className="w-full grow flex flex-col">
      <BoardComponent
        game={game.game}
        playerInfo={playerInfo}
        mode={boardMode}
        callbacks={gameCallbacks}
      />
      <GameOverDialog
        game={game.game}
        playerInfo={playerInfo}
        gameId={boardMode.gameId}
      />
    </div>
  );
}
