import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { SettingsDialog } from '../components/dialogs/SettingsDialog';
import {
  FaCog,
  FaEye,
  FaGamepad,
  FaHome,
  FaPlus,
  FaUsers,
} from 'react-icons/fa';
import { LuLogOut, LuSwords } from 'react-icons/lu';
import { MdWifi, MdWifiOff } from 'react-icons/md';

import { AppShell, Badge, Burger, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { SeeksDialog } from '../components/dialogs/SeeksDialog';
import { SpectateDialog } from '../components/dialogs/SpectateDialog';
import { useAuth, useWSAPI } from '../authHooks';
import { ReadyState } from 'react-use-websocket';
import { NewGameDialog } from '../components/dialogs/NewGameDialog';
import { useSeekList } from '../features/seeks';
import { useGamesList } from '../features/gameList';
import { usePlayerList } from '../features/players';
import { PlayersDialog } from '../components/dialogs/PlayersDialog';

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
  const [isPlayersOpen, setPlayersOpen] = useState(false);
  const [isNewGameOpen, setNewGameOpen] = useState(false);

  const { readyState } = useWSAPI();

  const seeks = useSeekList();
  const games = useGamesList();
  const players = usePlayerList();

  const { user, logout } = useAuth();

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
        <LuSwords size={18} />
        <p className="group-hover:underline">Join Game</p>
        <Badge
          color={
            Object.values(seeks).some(
              (s) =>
                s.opponent !== undefined &&
                user !== null &&
                s.opponent === user.username,
            )
              ? 'red'
              : 'gray'
          }
        >
          {Object.values(seeks).length.toString()}
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
        <p className="group-hover:underline">Watch</p>
        <Badge color="gray">{games.length.toString()}</Badge>
      </button>
      <button
        className={buttonClassName}
        onClick={() => {
          setPlayersOpen(true);
          close();
        }}
      >
        <FaUsers size={18} />
        <p className="group-hover:underline">Online</p>
        <Badge color="gray">{players.length.toString()}</Badge>
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
      <NewGameDialog
        isOpen={isNewGameOpen}
        onClose={() => {
          setNewGameOpen(false);
        }}
      />
      <PlayersDialog
        isOpen={isPlayersOpen}
        onClose={() => {
          setPlayersOpen(false);
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
          <Group visibleFrom="md" gap={'xs'}>
            {navElements}
          </Group>
          <div className="grow flex justify-end items-center pr-2">
            {readyState === ReadyState.OPEN ? (
              <MdWifi className="mx-2" size={18} />
            ) : (
              <MdWifiOff className="mx-2" size={18} />
            )}
            <button
              className="flex items-center p-2 cursor-pointer"
              onClick={() => {
                setSettingsOpen(true);
              }}
            >
              <FaCog size={18} />
            </button>
            <button
              className="flex items-center p-2 cursor-pointer"
              onClick={() => {
                logout();
              }}
            >
              <LuLogOut size={18} />
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
