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
import {
  FaCog,
  FaEye,
  FaGamepad,
  FaHome,
  FaSearch,
  FaUser,
} from 'react-icons/fa';
import { AppShell, Burger, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { SeeksDialog } from '../components/SeeksDialog';
import { SpectateDialog } from '../components/SpectateDialog';

interface RouterContext {
  auth: AuthState;
}

const linkClassName =
  'flex gap-[6px] items-center py-2 px-3 [&.active]:font-bold';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Root />,
});

function Root() {
  const [opened, { toggle }] = useDisclosure();
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isSeeksOpen, setSeeksOpen] = useState(false);
  const [isSpectateOpen, setSpectateOpen] = useState(false);

  const navElements = (
    <>
      <Link to="/" className={linkClassName} onClick={toggle}>
        <FaHome size={18} />
        Home
      </Link>
      <Link to="/play" className={linkClassName} onClick={toggle}>
        <FaGamepad size={18} />
        Play
      </Link>
      <button
        className="flex gap-[6px] items-center py-2 px-3 cursor-pointer"
        onClick={() => {
          setSeeksOpen(true);
          toggle();
        }}
      >
        <FaSearch size={18} />
        Seeks
      </button>
      <button
        className="flex gap-[6px] items-center py-2 px-3 cursor-pointer"
        onClick={() => {
          setSpectateOpen(true);
          toggle();
        }}
      >
        <FaEye size={18} />
        Games
      </button>
      <Link to="/account" className={linkClassName} onClick={toggle}>
        <FaUser size={18} />
        Account
      </Link>
      <button
        className="flex gap-[6px] items-center py-2 px-3 cursor-pointer"
        onClick={() => {
          setSettingsOpen(true);
          toggle();
        }}
      >
        <FaCog size={18} />
        Settings
      </button>
    </>
  );

  const modals = (
    <>
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => {
          setSettingsOpen(false);
        }}
      />
      <SeeksDialog
        isOpen={isSeeksOpen}
        onClose={() => {
          setSeeksOpen(false);
        }}
      />
      <SpectateDialog
        isOpen={isSpectateOpen}
        onClose={() => {
          setSpectateOpen(false);
        }}
      />
    </>
  );

  return (
    <AppShell
      header={{ height: 40 }}
      navbar={{
        width: 0,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header>
        <div
          className="flex items-center justify-start"
          style={{ height: '40px' }}
        >
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <p className="font-bold absolute inset-0 text-center flex justify-center items-center md:static px-2">
            Tak
          </p>
          <Group visibleFrom="sm">{navElements}</Group>
        </div>
      </AppShell.Header>
      <AppShell.Navbar hiddenFrom="sm">{navElements}</AppShell.Navbar>
      <AppShell.Main className="flex flex-col">
        <Outlet />
        {modals}
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </AppShell.Main>
    </AppShell>
  );
}
