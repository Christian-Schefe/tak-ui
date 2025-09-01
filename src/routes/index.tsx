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
import { FaArrowRight, FaDiscord, FaGraduationCap } from 'react-icons/fa6';
import bgImage from '../assets/parallax.jpg';
import { useAuth } from '../authHooks';
import { useEvents } from '../api/events';
import { Fragment } from 'react/jsx-runtime';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from '@mantine/form';
import { router } from '../router';
import { notifications } from '@mantine/notifications';

const discordLink = 'https://discord.gg/2xEt42X';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <MainPage />;
}

export function MainPage({
  loginRedirect,
  register,
}: {
  loginRedirect?: string;
  register?: boolean;
}) {
  const navigate = useNavigate();
  const { data: events } = useEvents();
  const categories = ['All'].concat(
    events?.data
      .map((e) => e.category)
      .filter((v, i, a) => a.indexOf(v) === i) ?? [],
  );

  const [category, setCategory] = useState<string>('All');
  const { login, isAuthenticated, signUp } = useAuth();

  const loginForm = useForm({
    initialValues: {
      username: '',
      password: '',
    },
  });

  const registerForm = useForm({
    initialValues: {
      username: '',
      email: '',
      retypeEmail: '',
    },
    validate: {
      retypeEmail: (value, values) =>
        value !== values.email ? 'Emails did not match' : null,
      username: (value) => (!value ? 'Username cannot be empty' : null),
      email: (value) => (!value ? 'Email cannot be empty' : null),
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
          {loginRedirect === undefined && register !== true ? (
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
                  <>
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
                    <Button
                      variant="outline"
                      onClick={() => {
                        void navigate({
                          to: '/register',
                        });
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
                <Button component="a" href={discordLink}>
                  <Group gap="xs">
                    <FaDiscord size={20} />
                    Find Players
                  </Group>
                </Button>
              </Stack>
            </>
          ) : register === true ? (
            <form
              className="w-full max-w-sm"
              onSubmit={registerForm.onSubmit((values) => {
                signUp(values.username, values.email);
                void navigate({ to: '/' });
                notifications.show({
                  title: 'Signed up successfully',
                  message: 'You will receive a confirmation email shortly.',
                  position: 'top-right',
                });
              })}
            >
              <Stack w="100%" p="md">
                <TextInput
                  placeholder="Username"
                  label="Username"
                  key="username"
                  autoComplete="username"
                  {...registerForm.getInputProps('username')}
                />
                <TextInput
                  placeholder="Email"
                  label="Email"
                  key="email"
                  autoComplete="email"
                  {...registerForm.getInputProps('email')}
                />
                <TextInput
                  placeholder="Confirm Email"
                  label="Confirm Email"
                  key="retypeEmail"
                  autoComplete="email"
                  {...registerForm.getInputProps('retypeEmail')}
                />
                <Group justify="end">
                  <Button component={Link} to="/" variant="outline">
                    Cancel
                  </Button>
                  <Button type="submit">Sign Up</Button>
                </Group>
              </Stack>
            </form>
          ) : (
            <form
              className="w-full max-w-sm"
              onSubmit={loginForm.onSubmit((values) => {
                login(values.username, values.password);
              })}
            >
              <Stack w="100%" p="md">
                <TextInput
                  placeholder="Username"
                  label="Username"
                  key="username"
                  autoComplete="username"
                  {...loginForm.getInputProps('username')}
                />
                <PasswordInput
                  placeholder="Password"
                  label="Password"
                  key="password"
                  autoComplete="current-password"
                  {...loginForm.getInputProps('password')}
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
