import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '../../../authHooks';
import { useGameById } from '../../../features/gameList';
import { PlayedGame } from '../../../components/PlayedGame';
import { useSubscribeToRemoteGame } from '../../../features/remoteGame';

export const Route = createFileRoute('/_app/_authenticated/spectate/$gameId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { gameId } = Route.useParams();
  const gameEntry = useGameById(gameId);
  const auth = useAuth();
  useSubscribeToRemoteGame(gameId, gameEntry);
  if (!gameEntry) {
    return (
      <div className="text-center font-bold text-lg p-2">
        No ongoing game to spectate.
      </div>
    );
  }
  const username = auth.user?.username;
  const isPlayer =
    username !== undefined &&
    (gameEntry.white === username || gameEntry.black === username);
  if (isPlayer) {
    return <div>Can't observe your own game</div>;
  }
  return <PlayedGame gameEntry={gameEntry} observed={true} />;
}
