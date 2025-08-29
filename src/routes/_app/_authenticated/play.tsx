import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '../../../authHooks';

import { RemoteGame } from '../../../components/RemoteGame';
import { useMemo } from 'react';
import { useGamesList } from '../../../features/gameList';

export const Route = createFileRoute('/_app/_authenticated/play')({
  component: RouteComponent,
});

function RouteComponent() {
  const games = useGamesList();
  const auth = useAuth();
  const username = auth.user?.username;
  const gameEntry = useMemo(
    () =>
      username !== undefined
        ? games.find((g) => g.white === username || g.black === username)
        : undefined,
    [games, username],
  );
  return <RemoteGame gameEntry={gameEntry} observed={false} />;
}
