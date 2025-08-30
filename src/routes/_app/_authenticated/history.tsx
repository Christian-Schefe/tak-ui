import { createFileRoute } from '@tanstack/react-router';
import { useGameDatabase } from '../../../api/gameDatabase';
import {
  Loader,
  Pagination,
  ScrollArea,
  Table,
  type TableData,
} from '@mantine/core';
import { useState } from 'react';

export const Route = createFileRoute('/_app/_authenticated/history')({
  component: RouteComponent,
});

function RouteComponent() {
  const [activePage, setPage] = useState(1);
  const { data: games } = useGameDatabase(activePage);
  if (!games)
    return (
      <div className="w-full flex justify-center grow items-center">
        <Loader />
      </div>
    );

  const data: TableData = {
    head: ['Id', 'Size', 'Komi', 'White', 'Black', 'Result', 'Type'],
    body: games.items.map((game) => [
      game.id,
      game.size,
      game.komi / 2,
      game.player_white,
      game.player_black,
      game.result,
      game.tournament === 1
        ? 'Tournament'
        : game.unrated === 1
          ? 'Unrated'
          : 'Normal',
    ]),
  };
  return (
    <div className="w-full flex grow flex-col items-center p-2 gap-2">
      <div className="w-full h-0 grow relative overflow-hidden">
        <ScrollArea className="absolute h-full w-full max-w-5xl mx-auto">
          <Table data={data} stickyHeader />
        </ScrollArea>
      </div>
      <Pagination
        value={activePage}
        onChange={setPage}
        total={games.totalPages}
      />
    </div>
  );
}
