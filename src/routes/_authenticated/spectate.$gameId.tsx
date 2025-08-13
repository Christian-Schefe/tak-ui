import { createFileRoute, Link } from '@tanstack/react-router';
import { ObservedGame } from '../../components/ObservedGame';
import { useGameData } from '../../gameData';
import type { GameSettings } from '../../packages/tak-core';
import { useMemo } from 'react';

export const Route = createFileRoute('/_authenticated/spectate/$gameId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { gameId } = Route.useParams();
  const gameData = useGameData();
  const gameEntry = useMemo(
    () => gameData.games.find((g) => g.id.toString() === gameId),
    [gameData.games, gameId],
  );
  if (!gameEntry) {
    return (
      <div>
        <Link to="/seeks">Find a Game</Link>
      </div>
    );
  }
  const settings: GameSettings = {
    boardSize: gameEntry.boardSize,
    komi: gameEntry.komi,
    reserve: {
      pieces: gameEntry.pieces,
      capstones: gameEntry.capstones,
    },
  };
  return (
    <ObservedGame gameId={gameId} settings={settings} interactive={false} />
  );
}
