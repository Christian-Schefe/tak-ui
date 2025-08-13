import { RouterProvider } from '@tanstack/react-router';
import { AuthProvider, useAuth } from './auth';
import { router } from './router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameDataProvider } from './gameData';

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GameDataProvider>
          <InnerApp />
        </GameDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
