import { RouterProvider } from '@tanstack/react-router';
import { AuthProvider, useAuth } from './auth';
import { router } from './router';
import useWebSocket from 'react-use-websocket';
import { wsOptions } from './websocket';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameDataProvider } from './gameData';

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

function tryPrintBlob(blob: Blob) {
  try {
    const reader = new FileReader();
    reader.onload = () => {
      console.log(reader.result);
    };
    reader.readAsText(blob);
  } catch {
    console.error('Failed to read blob as text');
  }
}

const queryClient = new QueryClient();

export function App() {
  useWebSocket('wss://playtak.com/ws', {
    ...wsOptions,
    onMessage: (msg) => tryPrintBlob(msg.data as Blob),
  });

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
