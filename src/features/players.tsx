import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import type { TextMessage } from '../auth';
import { useWSListener } from '../authHooks';
import { isDefined } from './utils';
import z from 'zod';

export interface PlayerEntry {
  username: string;
}

interface PlayerState {
  players: Record<string, PlayerEntry | undefined>;
}

export const usePlayerState = create<PlayerState>(() => ({
  players: {},
}));

export function usePlayerList() {
  const players = usePlayerState((state) => state.players);
  return useMemo(() => {
    return Object.values(players).filter(isDefined);
  }, [players]);
}

export function setPlayers(players: PlayerEntry[]) {
  usePlayerState.setState(() => {
    const newPlayers: Record<string, PlayerEntry | undefined> = {};
    for (const player of players) {
      newPlayers[player.username] = player;
    }
    return {
      players: newPlayers,
    };
  });
}

const playerSchema = z.array(z.string());

export function useUpdatePlayers() {
  const onMessage = useCallback((msg: TextMessage) => {
    const text = msg.text;
    if (text.startsWith('OnlinePlayers')) {
      try {
        const array: unknown = JSON.parse(text.replace('OnlinePlayers ', ''));
        const result = playerSchema.safeParse(array);
        if (result.success) {
          setPlayers(result.data.map((username) => ({ username })));
        } else {
          console.error('Invalid player list:', result.error);
        }
      } catch (e) {
        console.error('Failed to parse player list:', e);
      }
    }
  }, []);

  useWSListener('update-players', { onMessage });
}
