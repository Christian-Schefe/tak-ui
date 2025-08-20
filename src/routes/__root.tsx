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
import { FaCog, FaGamepad, FaHome, FaSearch, FaUser } from 'react-icons/fa';

interface RouterContext {
  auth: AuthState;
}

export function SettingsButton() {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <button
        className="flex gap-1 items-center py-2 px-3 hover:bg-surface-600 cursor-pointer"
        onClick={() => {
          setOpen(true);
        }}
      >
        <FaCog />
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

const linkClassName =
  'flex gap-1 items-center py-2 px-3 [&.active]:font-bold hover:bg-surface-600';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <div className="flex bg-surface-500 sticky top-0 z-50 overflow-hidden">
        <Link to="/" className={linkClassName}>
          <FaHome />
          Home
        </Link>
        <Link to="/play" className={linkClassName}>
          <FaGamepad />
          Play
        </Link>
        <Link to="/seeks" className={linkClassName}>
          <FaSearch />
          Seeks
        </Link>
        <Link to="/account" className={linkClassName}>
          <FaUser />
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
