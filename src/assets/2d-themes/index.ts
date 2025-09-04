import z, { object } from 'zod';
import classic from './classic.json';
import jungle from './jungle.json';
import ignis from './ignis.json';
import neon from './neon.json';
import discord from './discord.json';
import beach from './beach.json';
import assassin from './assassin.json';
import space from './space.json';

export type ColorTheme =
  | 'classic'
  | 'jungle'
  | 'ignis'
  | 'space'
  | 'neon'
  | 'discord'
  | 'beach'
  | 'assassin';

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

export const defaultTheme = themeSchema.parse(classic);

const themes: Record<ColorTheme, ThemeParams | undefined> = {
  classic: defaultTheme,
  jungle: themeSchema.parse(jungle),
  ignis: themeSchema.parse(ignis),
  neon: themeSchema.parse(neon),
  discord: themeSchema.parse(discord),
  beach: themeSchema.parse(beach),
  assassin: themeSchema.parse(assassin),
  space: themeSchema.parse(space),
};

export { themes };
