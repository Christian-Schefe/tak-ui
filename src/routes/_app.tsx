import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Fragment, useState } from 'react';
import { SettingsDialog } from '../components/dialogs/SettingsDialog';
import {
  FaChessBoard,
  FaEye,
  FaGamepad,
  FaPlus,
  FaUsers,
  FaGear,
  FaHouse,
  FaDatabase,
  FaUser,
} from 'react-icons/fa6';
import { LuLogOut, LuSwords, LuWifi, LuWifiOff } from 'react-icons/lu';

import { AppShell, Badge, Burger, Group, useMantineTheme } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { SeeksDialog } from '../components/dialogs/SeeksDialog';
import { SpectateDialog } from '../components/dialogs/SpectateDialog';
import { useAuth, useWSAPI } from '../authHooks';
import { ReadyState } from 'react-use-websocket';
import { NewGameDialog } from '../components/dialogs/NewGameDialog';
import { useSeekList } from '../features/seeks';
import { useGamesList } from '../features/gameList';
import { usePlayerList } from '../features/players';
import { PlayersDialog } from '../components/dialogs/PlayersDialog';
import { useRatings } from '../api/ratings';

export const Route = createFileRoute('/_app')({
  component: RouteComponent,
});

const linkClassName =
  'flex gap-[6px] items-center py-2 px-3 hover:underline text-nowrap';
const buttonClassName =
  'flex gap-[6px] items-center py-2 px-3 cursor-pointer group text-nowrap';

function elementsToList(items: { el: React.ReactNode; key: string }[]) {
  return items.map((item) => <Fragment key={item.key}>{item.el}</Fragment>);
}

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
  const ratings = useRatings(
    user?.username !== undefined ? [user.username] : [],
  );
  const rating =
    user?.username !== undefined ? ratings[user.username] : undefined;

  const linkHome = (
    <Link to="/" className={linkClassName} onClick={close}>
      <FaHouse size={18} />
      Home
    </Link>
  );

  const linkScratch = (
    <Link to="/scratch" className={linkClassName} onClick={close}>
      <FaChessBoard size={18} />
      Scratch Board
    </Link>
  );

  const buttonNewGame = (
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
  );

  const linkPlay = (
    <Link to="/play" className={linkClassName} onClick={close}>
      <FaGamepad size={18} />
      Play
    </Link>
  );

  const seeksCount = Object.values(seeks)
    .filter(
      (s) =>
        s.opponent === undefined ||
        s.opponent === '' ||
        (user !== null && s.opponent === user.username),
    )
    .length.toString();

  const buttonSeeks = (
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
        {seeksCount}
      </Badge>
    </button>
  );

  const gamesCount = games
    .filter(
      (game) =>
        !user || (game.white !== user.username && game.black !== user.username),
    )
    .length.toString();

  const buttonGames = (
    <button
      className={buttonClassName}
      onClick={() => {
        setSpectateOpen(true);
        close();
      }}
    >
      <FaEye size={18} />
      <p className="group-hover:underline">Watch</p>
      <Badge color="gray">{gamesCount}</Badge>
    </button>
  );

  const buttonPlayers = (
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
  );

  const linkGameDatabase = (
    <Link to="/history" className={linkClassName} onClick={close}>
      <FaDatabase size={18} />
      Games Database
    </Link>
  );

  const linkToAccount = (
    <Link to="/account" className={linkClassName} onClick={close}>
      <FaUser size={18} />
      Account
    </Link>
  );

  const elements = [
    { key: 'home', el: linkHome, visibleAfter: 1 },
    { key: 'scratch', el: linkScratch, visibleAfter: 2 },
    { key: 'newGame', el: buttonNewGame, visibleAfter: 0 },
    { key: 'play', el: linkPlay, visibleAfter: 2 },
    { key: 'seeks', el: buttonSeeks, visibleAfter: 0 },
    { key: 'games', el: buttonGames, visibleAfter: 0 },
    { key: 'players', el: buttonPlayers, visibleAfter: 1 },
    { key: 'history', el: linkGameDatabase, visibleAfter: 2 },
    { key: 'account', el: linkToAccount, visibleAfter: 2 },
  ];

  const largeBreakpoint = 'lg';

  const breakpointIndex = useThreeStageBreakpoint('md', largeBreakpoint);

  const visibleNavElements = elementsToList(
    elements.filter((el) => breakpointIndex > el.visibleAfter),
  );
  const hiddenNavElements = elementsToList(
    elements.filter((el) => breakpointIndex <= el.visibleAfter),
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
        width: 300,
        breakpoint: largeBreakpoint,
        collapsed: { mobile: !opened, desktop: !opened },
      }}
    >
      <AppShell.Header>
        <div
          className="flex items-center justify-start"
          style={{ height: '40px' }}
        >
          <Burger opened={opened} onClick={toggle} size="sm" mx="md" />

          {breakpointIndex > 0 && (
            <Group gap={'xs'} wrap="nowrap">
              {visibleNavElements}
            </Group>
          )}
          <div className="grow flex flex-nowrap justify-end items-center pr-2">
            <Link to="/players">
              <span className="font-bold">{user?.username}</span>
              {rating?.rating !== undefined
                ? ` (${rating.rating.toString()})`
                : ''}
            </Link>
            <button
              className="flex items-center p-2 cursor-pointer"
              onClick={() => {
                setSettingsOpen(true);
              }}
            >
              <FaGear size={18} />
            </button>
            {readyState === ReadyState.OPEN ? (
              <LuWifi className="mx-2" size={18} />
            ) : (
              <LuWifiOff className="mx-2" size={18} />
            )}
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
      <AppShell.Navbar>{hiddenNavElements}</AppShell.Navbar>
      <AppShell.Main className="flex flex-col">
        <Outlet />
        {modals}
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </AppShell.Main>
    </AppShell>
  );
}

function useThreeStageBreakpoint(
  smallBreakpoint: string,
  largeBreakpoint: string,
): number {
  const { breakpoints: themeBreakpoints } = useMantineTheme();
  const smallMatching = useMediaQuery(
    `(max-width: ${themeBreakpoints[smallBreakpoint]})`,
  );
  const largeMatching = useMediaQuery(
    `(max-width: ${themeBreakpoints[largeBreakpoint]})`,
  );
  return smallMatching ? 0 : largeMatching ? 1 : 2;
}
