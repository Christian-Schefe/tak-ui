import { useQueries, useQuery } from '@tanstack/react-query';
import z from 'zod';
import { API_BASE_URL } from '.';

const RatingSchema = z.object({
  name: z.string(),
  rating: z.number(),
  maxrating: z.number(),
  ratedgames: z.number(),
  isbot: z.boolean(),
  participation_rating: z.number().nullable(),
});

const RatingListSchema = z.object({
  items: z.array(RatingSchema),
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

type RatingResponse = z.infer<typeof RatingSchema>;

export function useRatingList(page: number) {
  return useQuery({
    queryKey: ['ratings-list', page],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/v1/ratings?page=${page.toString()}`,
      );
      if (!res.ok) {
        console.error('Failed to fetch ratings for page', page);
        return null;
      }
      return RatingListSchema.parse(await res.json());
    },
  });
}

export function useRatings(playerNames: string[]) {
  return useQueries({
    queries: playerNames.map((playerName) => ({
      queryKey: ['ratings', playerName],
      staleTime: 1000 * 60 * 60,
      queryFn: async () => {
        if (playerName.startsWith('Guest')) {
          return null;
        }
        const res = await fetch(`${API_BASE_URL}/v1/ratings/${playerName}`);
        if (!res.ok) {
          console.error('Failed to fetch rating for', playerName);
          return null;
        }
        return RatingSchema.parse(await res.json());
      },
    })),
    combine: (results) => {
      const result: Record<string, RatingResponse | undefined> = {};
      results.forEach((res) => {
        if (res.data) {
          result[res.data.name] = res.data;
        }
      });
      return result;
    },
  });
}
