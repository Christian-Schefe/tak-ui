import { RouterProvider } from '@tanstack/react-router';
import { AuthProvider } from './auth';
import { router } from './router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameDataProvider } from './gameData';
import { SettingsProvider } from './settings';
import { useAuth } from './authHooks';
import {
  createTheme,
  DEFAULT_THEME,
  MantineProvider,
  mergeMantineTheme,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const theme = createTheme({
  fontFamily: 'Nunito, sans-serif',
  primaryColor: 'blue',
  breakpoints: {
    tailwind_lg: '64em',
  },
});

const mergedTheme = mergeMantineTheme(DEFAULT_THEME, theme);

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

const queryClient = new QueryClient();

export function App() {
  return (
    <MantineProvider theme={mergedTheme} defaultColorScheme="dark">
      <Notifications />
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GameDataProvider>
              <InnerApp />
            </GameDataProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SettingsProvider>
    </MantineProvider>
  );
}
