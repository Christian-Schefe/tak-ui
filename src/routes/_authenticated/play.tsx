import { createFileRoute, Link } from '@tanstack/react-router';
import { type GameListEntry, useGameData } from '../../gameData';
import type { GameSettings } from '../../packages/tak-core';
import { useAuth } from '../../authHooks';
import { PlayedGame } from '../../components/PlayedGame';
import { useEffect, useRef } from 'react';

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
