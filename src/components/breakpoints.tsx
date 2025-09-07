import { useMantineTheme, type MantineBreakpoint } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

export function useBreakpoint(breakpoint: MantineBreakpoint) {
  const { breakpoints } = useMantineTheme();
  const matches = useMediaQuery(`(min-width: ${breakpoints[breakpoint]})`);
  return matches;
}
