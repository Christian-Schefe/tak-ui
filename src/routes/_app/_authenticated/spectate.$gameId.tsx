import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { RemoteGame } from '../../../components/RemoteGame';
import { useAuth } from '../../../authHooks';
import { useGamesList } from '../../../features/gameList';

export const Route = createFileRoute('/_app/_authenticated/spectate/$gameId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { gameId } = Route.useParams();
  const games = useGamesList();
  const gameEntry = useMemo(
    () => games.find((g) => g.id.toString() === gameId),
    [games, gameId],
  );
  const auth = useAuth();
  const username = auth.user?.username;
  const isPlayer =
    username !== undefined &&
    gameEntry !== undefined &&
    (gameEntry.white === username || gameEntry.black === username);
  if (isPlayer) {
    return <div>Can't observe your own game</div>;
  }
  return <RemoteGame gameEntry={gameEntry} observed={true} />;
}
