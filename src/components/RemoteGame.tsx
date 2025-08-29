import { useEffect, useState } from 'react';
import { PlayedGame } from './PlayedGame';
import type { GameListEntry } from '../features/gameList';

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
    return (
      <div className="text-center font-bold text-lg p-2">
        You're not observing or playing any game. Create or accept a seek to
        start playing.
      </div>
    );
  }

  return <PlayedGame gameEntry={gameEntryRef} observed={observed} />;
}
