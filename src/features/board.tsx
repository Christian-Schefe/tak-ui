import { useMemo } from 'react';
import type { BoardMode } from '../components/board';
import { useAuth } from '../authHooks';
import type { GameListEntry } from './gameList';

export function useBoardMode(observed: boolean, gameEntry: GameListEntry) {
  const { user } = useAuth();

  const boardMode: BoardMode = useMemo(() => {
    const gameId = gameEntry.id.toString();
    if (observed) return { type: 'spectator', gameId };
    if (user?.username === gameEntry.white)
      return { type: 'remote', localPlayer: 'white', gameId };
    if (user?.username === gameEntry.black)
      return { type: 'remote', localPlayer: 'black', gameId };
    return { type: 'spectator', gameId };
  }, [
    observed,
    user?.username,
    gameEntry.white,
    gameEntry.black,
    gameEntry.id,
  ]);
  return boardMode;
}
