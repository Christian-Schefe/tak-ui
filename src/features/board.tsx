import { useMemo, useState } from 'react';
import type { BoardMode } from '../components/board';
import { useAuth } from '../authHooks';
import type { GameListEntry } from './gameList';
import { getTimeRemaining, isClockActive } from '../packages/tak-core/game';
import type { GameUI } from '../packages/tak-core/ui';
import type { Player } from '../packages/tak-core';
import { useRafLoop } from 'react-use';

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

export function useClock(game: GameUI, player: Player, onTimeout: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(
    getTimeRemaining(game.actualGame, player, new Date()),
  );

  useRafLoop(() => {
    const remaining = getTimeRemaining(game.actualGame, player, new Date());
    if (
      isClockActive(game.actualGame, player) &&
      remaining !== null &&
      remaining === 0
    ) {
      onTimeout();
    }
    setTimeRemaining(remaining);
  }, true);

  const isActive =
    player === game.actualGame.currentPlayer &&
    game.actualGame.gameState.type === 'ongoing';

  return { timeRemaining, isActive };
}
