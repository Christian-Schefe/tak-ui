import { useEffect, useMemo, useState } from 'react';
import type { GameListEntry } from '../gameData';
import type { GameSettings } from '../packages/tak-core';
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

  const settings = useMemo(() => {
    if (!gameEntryRef) return undefined;
    const settings: GameSettings = {
      boardSize: gameEntryRef.boardSize,
      komi: gameEntryRef.komi,
      reserve: {
        pieces: gameEntryRef.pieces,
        capstones: gameEntryRef.capstones,
      },
      clock: {
        contingentMs: gameEntryRef.timeContingentSeconds * 1000,
        incrementMs: gameEntryRef.timeIncrementSeconds * 1000,
        extra: gameEntryRef.triggerMove
          ? {
              move: gameEntryRef.triggerMove.move,
              amountMs: gameEntryRef.triggerMove.amountSeconds * 1000,
            }
          : undefined,
      },
    };
    return settings;
  }, [gameEntryRef]);

  if (!gameEntryRef || !settings) {
    return <div>No game found</div>;
  }

  return (
    <PlayedGame
      gameEntry={gameEntryRef}
      settings={settings}
      observed={observed}
    />
  );
}
