import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Button,
  Stack,
  Image,
  Table,
  type TableData,
  Flex,
  Group,
} from '@mantine/core';
import { FaArrowRight, FaDiscord, FaGraduationCap } from 'react-icons/fa';
import bgImage from '../assets/parallax.jpg';
import headerImage from '../assets/board-top.svg';
import { useAuth } from '../authHooks';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const eventTableData: TableData = {
    head: ['Event', 'Dates', 'Details'],
    body: [['Test Event 1', '2023-10-01', 'Details | Standings']],
  };
  const auth = useAuth();

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      <Flex direction="column" align="center" style={{ flexGrow: 1 }}>
        <div
          className="flex flex-col md:flex-row items-center justify-center w-full md:gap-4"
          style={{
            backgroundImage: `url(${headerImage})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
          }}
        >
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
            <Button onClick={() => void navigate({ to: '/scratch' })}>
              <Group gap={'xs'}>
                <FaDiscord size={20} />
                Find Players
              </Group>
            </Button>
          </Stack>
        </div>
        <div
          className="w-full px-2 py-30 flex justify-center items-center"
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
        <div className="w-full grow flex flex-col justify-start items-center text-black">
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl mt-10 text-black">
              UPCOMING <span className="font-bold">EVENTS</span>
            </h1>
            <Table data={eventTableData} />
          </div>
        </div>
      </Flex>
    </div>
  );
}
