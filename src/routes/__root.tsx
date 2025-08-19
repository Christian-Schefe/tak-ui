import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { AuthState } from '../auth';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { SettingsDialog } from '../components/SettingsDialog';

interface RouterContext {
  auth: AuthState;
}

export function SettingsButton() {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Settings</button>
      <SettingsDialog isOpen={isOpen} onClose={() => setOpen(false)} />
    </>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <div className="p-2 flex gap-4 bg-surface-500 sticky top-0 z-50">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <Link to="/play" className="[&.active]:font-bold">
          Play
        </Link>
        <Link to="/seeks" className="[&.active]:font-bold">
          Seeks
        </Link>
        <Link to="/account" className="[&.active]:font-bold">
          Account
        </Link>
        <SettingsButton />
      </div>
      <Outlet />
      <TanStackRouterDevtools />
      <ReactQueryDevtools />
    </>
  ),
});
