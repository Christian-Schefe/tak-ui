import { useQuery } from '@tanstack/react-query';
import z from 'zod';
import { API_BASE_URL } from '.';
/*"id": 756021,
            "date": 1756557810379,
            "size": 6,
            "player_white": "IntuitionBot",
            "player_black": "Guest7066",
            "notation": "",
            "result": "0-0",
            "timertime": 900,
            "timerinc": 30,
            "rating_white": 1655,
            "rating_black": 0,
            "unrated": 0,
            "tournament": 0,
            "komi": 0,
            "pieces": 30,
            "capstones": 1,
            "rating_change_white": -1000,
            "rating_change_black": -1000,
            "extra_time_amount": 0,
            "extra_time_trigger": 0*/

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
  extra_time_amount: z.number(),
  extra_time_trigger: z.number(),
});

const EventsSchema = z.object({
  items: z.array(HistoricGameSchema),
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

export type Event = z.infer<typeof HistoricGameSchema>;
export type Events = z.infer<typeof EventsSchema>;

export function useGameDatabase(page: number) {
  return useQuery<Events>({
    queryKey: ['events', page],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/v1/games-history?page=${page.toString()}&limit=50&mirror=true`,
      );
      const parsed = EventsSchema.safeParse(await res.json());
      if (!parsed.success) {
        console.error('Failed to fetch events:', parsed.error);
        return { items: [], total: 0, page: 1, perPage: 50, totalPages: 1 };
      }
      return parsed.data;
    },
    staleTime: Infinity,
  });
}
