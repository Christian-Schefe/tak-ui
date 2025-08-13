import { createFileRoute, Link } from '@tanstack/react-router';
import { ObservedGame } from '../../components/ObservedGame';
import { useGameData } from '../../gameData';
import type { GameSettings } from '../../packages/tak-core';
import { useAuth } from '../../auth';

export const Route = createFileRoute('/_authenticated/play')({
  component: RouteComponent,
});

function RouteComponent() {
  const gameData = useGameData();
  const auth = useAuth();
  const username = auth.user!.username;
  const gameEntry = gameData.games.find(
    (g) => g.white === username || g.black === username,
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
    <ObservedGame
      gameId={gameEntry.id.toString()}
      settings={settings}
      interactive={true}
    />
  );
}
