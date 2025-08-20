import { useQueries, useQuery } from '@tanstack/react-query';
import z from 'zod';
import { API_BASE_URL } from '.';

const RatingSchema = z.object({
  name: z.string(),
  rating: z.number(),
  maxrating: z.number(),
  ratedgames: z.number(),
  isbot: z.boolean(),
  participation_rating: z.number(),
});

export function useRating(playerName: string) {
  return useQuery({
    queryKey: ['ratings', playerName],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/v1/ratings/${playerName}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return RatingSchema.parse(await res.json());
    },
  });
}

export function useRatings(playerNames: string[]) {
  return useQueries({
    queries: playerNames.map((playerName) => ({
      queryKey: ['ratings', playerName],
      staleTime: 1000 * 60 * 5,
      queryFn: () => {
        //const res = await fetch(`${API_BASE_URL}/v1/ratings/${playerName}`);
        //if (!res.ok)
        return {
          name: playerName,
          rating: 1000,
          maxrating: 0,
          ratedgames: 0,
          isbot: false,
          participation_rating: 0,
        };
        //return RatingSchema.parse(await res.json());
      },
    })),
    combine: (results) => {
      return {
        data: results.map((result) => result.data),
      };
    },
  });
}
