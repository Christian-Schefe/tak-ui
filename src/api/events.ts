import { useQuery } from '@tanstack/react-query';
import z from 'zod';
import { API_BASE_URL } from '.';

const EventSchema = z.object({
  name: z.string(),
  event: z.string(),
  category: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  details: z.string(),
  registration: z.string().nullable(),
  standings: z.string().nullable(),
});

const EventsSchema = z.object({
  data: z.array(EventSchema),
});

export type Event = z.infer<typeof EventSchema>;
export type Events = z.infer<typeof EventsSchema>;

export function useEvents() {
  return useQuery<Events>({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/events`);
      const parsed = EventsSchema.safeParse(await res.json());
      if (!parsed.success) {
        console.error('Failed to fetch events:', parsed.error);
        return { data: [] };
      }
      return parsed.data;
    },
    staleTime: Infinity,
  });
}
