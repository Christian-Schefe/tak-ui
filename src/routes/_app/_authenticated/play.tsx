import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '../../../authHooks';
import { useActiveGameByUsername } from '../../../features/gameList';
import { RemoteGame } from '../../../components/RemoteGame';
import { useRemoteGame } from '../../../features/remoteGame';
import { logDebug } from '../../../logger';

export const Route = createFileRoute('/_app/_authenticated/play')({
  component: RouteComponent,
});

function RouteComponent() {
  const auth = useAuth();
  const gameEntry = useActiveGameByUsername(auth.user?.username);
  const game = useRemoteGame(gameEntry?.id.toString());
  if (!gameEntry || !game) {
    logDebug('No ongoing game to play.', gameEntry, game);
    return (
      <div className="text-center font-bold text-lg p-2">
        You're not playing any game. Create or accept a seek to start playing.
      </div>
    );
  }
  return <RemoteGame gameEntry={gameEntry} game={game} observed={false} />;
}
