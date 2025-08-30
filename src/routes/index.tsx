import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  Button,
  Stack,
  Image,
  Table,
  type TableData,
  Flex,
  Group,
  Anchor,
  Chip,
  TextInput,
  PasswordInput,
} from '@mantine/core';
import { FaArrowRight, FaDiscord, FaGraduationCap } from 'react-icons/fa';
import bgImage from '../assets/parallax.jpg';
import { useAuth } from '../authHooks';
import { useEvents } from '../api/events';
import { Fragment } from 'react/jsx-runtime';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from '@mantine/form';
import { router } from '../router';

const discordLink = 'https://discord.gg/2xEt42X';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <MainPage />;
}

export function MainPage({ loginRedirect }: { loginRedirect?: string }) {
  const navigate = useNavigate();
  const { data: events } = useEvents();
  const categories = ['All'].concat(
    events?.data
      .map((e) => e.category)
      .filter((v, i, a) => a.indexOf(v) === i) ?? [],
  );

  const [category, setCategory] = useState<string>('All');
  const { login, isAuthenticated } = useAuth();

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    console.log('Checking authentication status...', isAuthenticated);
    if (isAuthenticated && loginRedirect !== undefined) {
      void router.navigate({ to: loginRedirect });
    }
  }, [isAuthenticated, loginRedirect]);

  const eventTableData: TableData = useMemo(
    () => ({
      head: ['Event', 'Dates', 'Details'],
      body:
        events?.data
          .filter((e) => category === 'All' || e.category === category)
          .map((e) => {
            return [
              e.name,
              `${e.start_date} - ${e.end_date}`,
              <div key={e.name} className="flex gap-2">
                {[
                  <Anchor href={e.details} key="details">
                    Details
                  </Anchor>,
                  ...(e.registration !== null
                    ? [
                        <Fragment key="registration">
                          <p>|</p>
                          <Anchor href={e.registration}>Register</Anchor>
                        </Fragment>,
                      ]
                    : []),
                  ...(e.standings !== null
                    ? [
                        <Fragment key="standings">
                          <p>|</p>
                          <Anchor href={e.standings}>Standings</Anchor>
                        </Fragment>,
                      ]
                    : []),
                ]}
              </div>,
            ];
          }) ?? [],
    }),
    [events, category],
  );
  const auth = useAuth();

  return (
    <div className="w-full min-h-screen flex flex-col">
      <Flex direction="column" align="center" style={{ flexGrow: 1 }}>
        <div className="flex flex-col md:flex-row items-center justify-center w-full md:gap-4 min-h-80 diagonal-checkerboard">
          {loginRedirect === undefined ? (
            <>
              <div className="flex items-center justify-center gap-2 my-20">
                <p
                  className="font-bold text-5xl"
                  style={{
                    background: 'linear-gradient(to right, #61a4ec, #1971c2)',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  TAK
                </p>
                <Image src="/tak.svg" w="70px" h="70px" />
              </div>
              <Stack maw="250px" w="100%" p="md">
                {auth.isAuthenticated ? (
                  <Button
                    variant="outline"
                    onClick={() => void navigate({ to: '/scratch' })}
                  >
                    Play
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() =>
                      void navigate({
                        to: '/login',
                        search: { redirect: '/scratch' },
                      })
                    }
                  >
                    Login
                  </Button>
                )}
                <Button component="a" href={discordLink}>
                  <Group gap="xs">
                    <FaDiscord size={20} />
                    Find Players
                  </Group>
                </Button>
              </Stack>
            </>
          ) : (
            <form
              className="w-full max-w-sm"
              onSubmit={form.onSubmit((values) => {
                login(values.username, values.password);
              })}
            >
              <Stack w="100%" p="md">
                <TextInput
                  placeholder="Username"
                  label="Username"
                  key="username"
                  {...form.getInputProps('username')}
                />
                <PasswordInput
                  placeholder="Password"
                  label="Password"
                  key="password"
                  {...form.getInputProps('password')}
                />
                <Group justify="end">
                  <Button component={Link} to="/" variant="outline">
                    Cancel
                  </Button>
                  <Button type="submit">Login</Button>
                </Group>
              </Stack>
            </form>
          )}
        </div>
        <div
          className="w-full px-2 py-20 flex justify-center items-center"
          style={{
            backgroundImage: `linear-gradient(#1971c255, #1971c255),url(${bgImage as string})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'multiply',
          }}
        >
          <a
            href="https://ustak.org/play-beautiful-game-tak/"
            className="text-xl md:text-3xl"
            style={{ color: 'white' }}
          >
            <div className="flex items-center gap-2 hover:underline">
              <FaGraduationCap />
              LEARN TO PLAY TAK
              <FaArrowRight />
            </div>
          </a>
        </div>
        <div className="w-full grow flex flex-col justify-start items-center">
          <div className="w-full max-w-4xl flex flex-col gap-2">
            <h1 className="text-3xl mt-10">
              UPCOMING <span className="font-bold">EVENTS</span>
            </h1>
            <Chip.Group
              value={category}
              onChange={(e) => {
                setCategory(typeof e === 'string' ? e : 'All');
              }}
            >
              <Group>
                {categories.map((category) => (
                  <Chip key={category} value={category}>
                    {category}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
            <Table data={eventTableData} />
          </div>
        </div>
      </Flex>
    </div>
  );
}
