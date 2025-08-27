import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { SettingsDialog } from '../components/SettingsDialog';
import {
  FaCog,
  FaEye,
  FaGamepad,
  FaHome,
  FaPlus,
  FaSearch,
  FaUser,
} from 'react-icons/fa';
import { MdWifi, MdWifiOff } from 'react-icons/md';

import { AppShell, Badge, Burger, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { SeeksDialog } from '../components/SeeksDialog';
import { SpectateDialog } from '../components/SpectateDialog';
import { useAuth, useWSAPI } from '../authHooks';
import { ReadyState } from 'react-use-websocket';
import { NewGameDialog } from '../components/NewGameDialog';
import { useGameData } from '../gameDataHooks';

export const Route = createFileRoute('/_app')({
  component: RouteComponent,
});

const linkClassName =
  'flex gap-[6px] items-center py-2 px-3 [&.active]:font-bold hover:underline';
const buttonClassName =
  'flex gap-[6px] items-center py-2 px-3 cursor-pointer group';

function RouteComponent() {
  const [opened, { toggle, close }] = useDisclosure();
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isSeeksOpen, setSeeksOpen] = useState(false);
  const [isSpectateOpen, setSpectateOpen] = useState(false);
  const [isNewGameOpen, setNewGameOpen] = useState(false);

  const { readyState } = useWSAPI();

  const { seeks, games } = useGameData();
  const { user } = useAuth();

  const navElements = (
    <>
      <Link to="/" className={linkClassName} onClick={close}>
        <FaHome size={18} />
        Home
      </Link>
      <button
        className={buttonClassName}
        onClick={() => {
          setNewGameOpen(true);
          close();
        }}
      >
        <FaPlus size={18} />
        <p className="group-hover:underline">New Game</p>
      </button>
      <Link to="/play" className={linkClassName} onClick={close}>
        <FaGamepad size={18} />
        Play
      </Link>
      <button
        className={buttonClassName}
        onClick={() => {
          setSeeksOpen(true);
          close();
        }}
      >
        <FaSearch size={18} />
        <p className="group-hover:underline">Seeks</p>
        <Badge
          color={
            seeks.some(
              (s) => s.opponent && user && s.opponent === user.username,
            )
              ? 'red'
              : 'gray'
          }
        >
          {seeks.length.toString()}
        </Badge>
      </button>
      <button
        className={buttonClassName}
        onClick={() => {
          setSpectateOpen(true);
          close();
        }}
      >
        <FaEye size={18} />
        <p className="group-hover:underline">Games</p>
        <Badge color="gray">{games.length.toString()}</Badge>
      </button>
      <Link to="/account" className={linkClassName} onClick={close}>
        <FaUser size={18} />
        Account
      </Link>
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
      <NewGameDialog
        isOpen={isNewGameOpen}
        onClose={() => {
          setNewGameOpen(false);
        }}
      />
    </>
  );

  return (
    <AppShell
      header={{ height: 40 }}
      navbar={{
        width: 0,
        breakpoint: 'md',
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header>
        <div
          className="flex items-center justify-start"
          style={{ height: '40px' }}
        >
          <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
          <p className="font-bold absolute inset-0 text-center flex justify-center items-center md:static px-2 pointer-events-none">
            <img src="/tak.svg" className="h-6 w-6 mr-2 inline-block" />
            Tak
          </p>
          <Group visibleFrom="md" gap={'xs'}>
            {navElements}
          </Group>
          <div className="grow flex justify-end items-center">
            {readyState === ReadyState.OPEN ? <MdWifi /> : <MdWifiOff />}
            <button
              className="flex gap-[6px] items-center py-2 px-3 cursor-pointer"
              onClick={() => {
                setSettingsOpen(true);
              }}
            >
              <FaCog size={18} />
            </button>
          </div>
        </div>
      </AppShell.Header>
      <AppShell.Navbar hiddenFrom="md">{navElements}</AppShell.Navbar>
      <AppShell.Main className="flex flex-col">
        <Outlet />
        {modals}
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </AppShell.Main>
    </AppShell>
  );
}
