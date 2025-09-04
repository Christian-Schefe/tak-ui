import {
  Loader,
  Pagination,
  ScrollArea,
  Table,
  type TableData,
} from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useRatingList } from '../../../api/ratings';

export const Route = createFileRoute('/_app/_authenticated/players')({
  component: RouteComponent,
});

function RouteComponent() {
  const [activePage, setPage] = useState(0);
  const { data: playerRatings } = useRatingList(activePage);

  if (!playerRatings)
    return (
      <div className="w-full flex justify-center grow items-center">
        <Loader />
      </div>
    );

  const data: TableData = {
    head: [
      'Rank',
      'Username',
      'Participation Rating',
      'Rating',
      'Best Rating',
      'Games',
    ],
    body: playerRatings.items.map((player, index) => [
      index + 1 + activePage * playerRatings.perPage,
      player.name,
      player.participation_rating ?? 'N/A',
      player.rating,
      player.maxrating,
      player.ratedgames,
    ]),
  };

  return (
    <div className="w-full flex grow flex-col items-center p-2 gap-2">
      <div className="w-full h-0 grow relative overflow-hidden">
        <ScrollArea className="absolute h-full w-full max-w-5xl mx-auto">
          <Table data={data} stickyHeader highlightOnHover />
        </ScrollArea>
      </div>
      <Pagination
        value={activePage + 1}
        onChange={(p) => {
          setPage(Math.max(0, p - 1));
        }}
        total={playerRatings.totalPages}
      />
    </div>
  );
}
