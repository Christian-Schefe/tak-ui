import { createFileRoute } from '@tanstack/react-router';
import { useGameData } from '../../../gameData';
import { useAuth } from '../../../authHooks';

import { RemoteGame } from '../../../components/RemoteGame';
import { useMemo } from 'react';

export const Route = createFileRoute('/_app/_authenticated/play')({
  component: RouteComponent,
});

function RouteComponent() {
  const gameData = useGameData();
  const auth = useAuth();
  const username = auth.user?.username;
  const gameEntry = useMemo(
    () =>
      username
        ? gameData.games.find(
            (g) => g.white === username || g.black === username,
          )
        : undefined,
    [gameData.games, username],
  );
  return <RemoteGame gameEntry={gameEntry} observed={false} />;
}
