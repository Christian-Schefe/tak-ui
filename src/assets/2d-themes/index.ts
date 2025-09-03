import z, { object } from 'zod';
import classic from './classic.json';
import jungle from './jungle.json';
import ignis from './ignis.json';
import neon from './neon.json';
import discord from './discord.json';

export type ColorTheme = 'classic' | 'jungle' | 'ignis' | 'neon' | 'discord';

const pieceColorSchema = z.object({
  background: z.string(),
  border: z.string(),
  text: z.string().optional(),
  capstoneOverride: z
    .object({
      background: z.string(),
      border: z.string(),
    })
    .optional(),
});

export const themeSchema = z.object({
  background: z.string(),
  text: z.string(),
  board1: z.string(),
  board2: z.string(),
  highlight: z.string(),
  hover: z.string(),
  piece1: pieceColorSchema,
  piece2: pieceColorSchema,
  board: object({
    spacing: z.string(),
    rounded: z.string(),
    tiling: z.enum(['checkerboard', 'rings', 'linear']),
  }),
  pieces: object({
    rounded: z.number(),
    border: z.string(),
  }),
});

export type ThemeParams = z.infer<typeof themeSchema>;

const themes: Record<ColorTheme, ThemeParams> = {
  classic: themeSchema.parse(classic),
  jungle: themeSchema.parse(jungle),
  ignis: themeSchema.parse(ignis),
  neon: themeSchema.parse(neon),
  discord: themeSchema.parse(discord),
};

export { themes };
