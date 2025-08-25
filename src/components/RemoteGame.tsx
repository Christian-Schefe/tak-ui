import { useEffect, useState } from 'react';
import type { GameListEntry } from '../gameData';
import { PlayedGame } from './PlayedGame';

export function RemoteGame({
  gameEntry,
  observed,
}: {
  gameEntry: GameListEntry | undefined;
  observed: boolean;
}) {
  const [gameEntryRef, setGameEntryRef] = useState<GameListEntry | undefined>(
    gameEntry,
  );

  useEffect(() => {
    if (!gameEntry) return;
    setGameEntryRef(gameEntry);
  }, [gameEntry]);

  if (!gameEntryRef) {
    return <div>No game found</div>;
  }

  return <PlayedGame gameEntry={gameEntryRef} observed={observed} />;
}
