import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import type { TextMessage } from '../auth';
import { useWSListener } from '../authHooks';
import { isDefined } from './utils';

export interface SeekEntry {
  id: number;
  creator: string;
  timeContingent: number;
  timeIncrement: number;
  halfKomi: number;
  boardSize: number;
  capstones: number;
  pieces: number;
  unrated: boolean;
  tournament: boolean;
  color: string;
  opponent?: string | undefined;
  triggerMove?:
    | {
        move: number;
        amount: number;
      }
    | undefined;
}

interface SeekState {
  seeks: Record<number, SeekEntry | undefined>;
}

export const useSeekState = create<SeekState>(() => ({
  seeks: {},
}));

export function useSeekList() {
  const seeks = useSeekState((state) => state.seeks);
  return useMemo(() => {
    return Object.values(seeks).filter(isDefined);
  }, [seeks]);
}

export function addSeek(seek: SeekEntry) {
  useSeekState.setState((state) => ({
    seeks: {
      ...state.seeks,
      [seek.id]: seek,
    },
  }));
}

export function removeSeek(seekId: number) {
  useSeekState.setState((state) => {
    const { [seekId]: _, ...seeks } = state.seeks;
    return { seeks };
  });
}

export function removeAllSeeks() {
  useSeekState.setState({ seeks: {} });
}

export function useUpdateSeeks() {
  const onMessage = useCallback((msg: TextMessage) => {
    const text = msg.text;
    if (text.startsWith('Seek new')) {
      const newSeek = parseAddSeekMessage(text);
      if (newSeek) {
        addSeek(newSeek);
      } else {
        console.error('Failed to add seek:', text);
      }
    } else if (text.startsWith('Seek remove')) {
      const removedSeekId = parseRemoveSeekMessage(text);
      if (removedSeekId !== null) {
        removeSeek(removedSeekId);
      } else {
        console.error('Failed to remove seek:', text);
      }
    }
  }, []);

  useWSListener('update-seeks', { onMessage });
}

const seekAddRegex =
  /^Seek new (\d+) ([A-Za-z0-9_]+) (\d+) (\d+) (\d+) ([WBA]) (\d+) (\d+) (\d+) (0|1) (0|1) (\d+) (\d+) ([A-Za-z0-9_]*)/;
const seekRemoveRegex = /^Seek remove (\d+)/;

function parseAddSeekMessage(message: string): SeekEntry | null {
  const matches = seekAddRegex.exec(message);
  if (!matches) return null;

  const triggerMoveAmount = parseInt(matches[13]);
  const opponent = matches[14];

  const seek: SeekEntry = {
    id: parseInt(matches[1]),
    creator: matches[2],
    boardSize: parseInt(matches[3]),
    timeContingent: parseInt(matches[4]),
    timeIncrement: parseInt(matches[5]),
    color: matches[6] as 'W' | 'B' | 'A',
    halfKomi: parseInt(matches[7]),
    pieces: parseInt(matches[8]),
    capstones: parseInt(matches[9]),
    unrated: matches[10] === '1',
    tournament: matches[11] === '1',
    triggerMove:
      triggerMoveAmount > 0
        ? {
            move: parseInt(matches[12]),
            amount: triggerMoveAmount,
          }
        : undefined,
    opponent: opponent === '0' ? undefined : opponent,
  };
  return seek;
}

function parseRemoveSeekMessage(message: string): number | null {
  const matches = seekRemoveRegex.exec(message);
  if (!matches) return null;

  return parseInt(matches[1]);
}
