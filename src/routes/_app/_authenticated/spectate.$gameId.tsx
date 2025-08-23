import { createFileRoute } from '@tanstack/react-router';
import { useGameData } from '../../../gameDataHooks';
import { useMemo } from 'react';
import { RemoteGame } from '../../../components/RemoteGame';
import { useAuth } from '../../../authHooks';

export const Route = createFileRoute('/_app/_authenticated/spectate/$gameId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { gameId } = Route.useParams();
  const gameData = useGameData();
  const gameEntry = useMemo(
    () => gameData.games.find((g) => g.id.toString() === gameId),
    [gameData.games, gameId],
  );
  const auth = useAuth();
  const username = auth.user?.username;
  const isPlayer =
    auth.user &&
    gameEntry &&
    (gameEntry.white === username || gameEntry.black === username);
  if (isPlayer) {
    return <div>Can't observe your own game</div>;
  }
  return <RemoteGame gameEntry={gameEntry} observed={true} />;
}
