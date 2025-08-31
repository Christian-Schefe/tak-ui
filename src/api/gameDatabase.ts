import { useQuery } from '@tanstack/react-query';
import z from 'zod';
import { API_BASE_URL } from '.';

const HistoricGameSchema = z.object({
  id: z.number(),
  date: z.number(),
  size: z.number(),
  player_white: z.string(),
  player_black: z.string(),
  notation: z.string(),
  result: z.string(),
  timertime: z.number(),
  timerinc: z.number(),
  rating_white: z.number(),
  rating_black: z.number(),
  unrated: z.number(),
  tournament: z.number(),
  komi: z.number(),
  pieces: z.number(),
  capstones: z.number(),
  rating_change_white: z.number(),
  rating_change_black: z.number(),
  extra_time_amount: z.number().nullish(),
  extra_time_trigger: z.number().nullish(),
});

const HistoricGamesSchema = z.object({
  items: z.array(HistoricGameSchema),
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

export type HistoricGame = z.infer<typeof HistoricGameSchema>;
export type HistoricGames = z.infer<typeof HistoricGamesSchema>;

export function useGameDatabase(page: number) {
  return useQuery<HistoricGames>({
    queryKey: ['historicGames', page],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/v1/games-history?page=${page.toString()}&limit=50&mirror=true`,
      );
      const parsed = HistoricGamesSchema.safeParse(await res.json());
      if (!parsed.success) {
        console.error('Failed to fetch historic games:', parsed.error);
        return { items: [], total: 0, page: 1, perPage: 50, totalPages: 1 };
      }
      return parsed.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useGamePTN(gameId: string) {
  return useQuery<string>({
    queryKey: ['historicGame', gameId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/v1/games-history/ptn/${gameId}`);
      return await res.text();
    },
    staleTime: Infinity,
  });
}
