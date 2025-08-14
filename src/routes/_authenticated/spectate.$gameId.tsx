import { createFileRoute, Link } from '@tanstack/react-router';
import { ObservedGame } from '../../components/ObservedGame';
import { useGameData, type GameListEntry } from '../../gameData';
import type { GameSettings } from '../../packages/tak-core';
import { useEffect, useMemo, useRef } from 'react';

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
  const gameEntryRef = useRef<GameListEntry | undefined>(gameEntry);
  useEffect(() => {
    if (!gameEntry) return;
    gameEntryRef.current = gameEntry;
  }, [gameEntry]);

  if (!gameEntryRef.current) {
    return (
      <div>
        <Link to="/seeks">Find a Game</Link>
      </div>
    );
  }
  const settings: GameSettings = {
    boardSize: gameEntryRef.current.boardSize,
    komi: gameEntryRef.current.komi,
    reserve: {
      pieces: gameEntryRef.current.pieces,
      capstones: gameEntryRef.current.capstones,
    },
  };

  return <ObservedGame gameId={gameId} settings={settings} />;
}
