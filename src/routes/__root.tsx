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
      <button
        className="py-2 px-3 hover:bg-surface-600"
        onClick={() => {
          setOpen(true);
        }}
      >
        Settings
      </button>
      <SettingsDialog
        isOpen={isOpen}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <div className="flex bg-surface-500 sticky top-0 z-50">
        <Link to="/" className="py-2 px-3 [&.active]:font-bold hover:bg-surface-600">
          Home
        </Link>
        <Link
          to="/play"
          className="py-2 px-3 [&.active]:font-bold hover:bg-surface-600"
        >
          Play
        </Link>
        <Link
          to="/seeks"
          className="py-2 px-3 [&.active]:font-bold hover:bg-surface-600"
        >
          Seeks
        </Link>
        <Link
          to="/account"
          className="py-2 px-3 [&.active]:font-bold hover:bg-surface-600"
        >
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
