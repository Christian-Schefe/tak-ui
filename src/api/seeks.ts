import { useQuery } from '@tanstack/react-query';
import z from 'zod';
import { API_BASE_URL } from '.';

type SeekResponse = z.infer<typeof SeekSchema>;

const SeekSchema = z.object({
  id: z.number(),
  creator: z.string(),
  opponent: z.string().optional(),
  timeContingent: z.number(),
  timeIncrement: z.number(),
  komi: z.number(),
  boardSize: z.number(),
  capstones: z.number(),
  pieces: z.number(),
  unrated: z.boolean(),
  tournament: z.boolean(),
  color: z.string(),
  triggerMove: z
    .object({
      move: z.number(),
      amount: z.number(),
    })
    .optional(),
});

const SeekSchemaArray = z.array(SeekSchema);

export function useSeeks() {
  return useQuery<SeekResponse[]>({
    queryKey: ['seeks'],
    queryFn: async () => {
      return [];
      const res = await fetch(`${API_BASE_URL}/v1/seeks`);
      if (!res.ok) throw new Error('Network response was not ok');
      return SeekSchemaArray.parse(await res.json());
    },
  });
}
