import { createFileRoute } from '@tanstack/react-router';
import { type GameListEntry, useGameData } from '../../gameData';
import type { GameSettings } from '../../packages/tak-core';
import { useAuth } from '../../authHooks';
import { PlayedGame } from '../../components/PlayedGame';
import { useEffect, useRef } from 'react';
import { useUpdate } from 'react-use';

export const Route = createFileRoute('/_authenticated/play')({
  component: RouteComponent,
});

function RouteComponent() {
  const gameData = useGameData();
  const auth = useAuth();
  const username = auth.user?.username;
  const gameEntry = username
    ? gameData.games.find((g) => g.white === username || g.black === username)
    : undefined;
  const gameEntryRef = useRef<GameListEntry | undefined>(gameEntry);
  const update = useUpdate();
  useEffect(() => {
    if (!gameEntry) return;
    gameEntryRef.current = gameEntry;
    update();
  }, [gameEntry, update]);
  if (!gameEntryRef.current) {
    return <div>You're not playing a game</div>;
  }
  const settings: GameSettings = {
    boardSize: gameEntryRef.current.boardSize,
    komi: gameEntryRef.current.komi,
    reserve: {
      pieces: gameEntryRef.current.pieces,
      capstones: gameEntryRef.current.capstones,
    },
    clock: {
      contingent: gameEntryRef.current.timeContingent,
      increment: gameEntryRef.current.timeIncrement,
    },
  };
  return (
    <PlayedGame
      gameId={gameEntryRef.current.id.toString()}
      settings={settings}
      observed={false}
    />
  );
}
