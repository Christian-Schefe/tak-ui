import { Modal, Table } from '@mantine/core';
import { useGameData } from '../gameData';
import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useRatings } from '../api/ratings';

export function SpectateDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { games } = useGameData();
  const nav = useNavigate();

  const players = useMemo(() => {
    const playerArr = games.flatMap((game) => [game.white, game.black]);
    return playerArr.filter((p, i) => playerArr.indexOf(p) === i);
  }, [games]);

  const ratings = useRatings(players);
  const ratingByName = Object.fromEntries(
    ratings.data.flatMap((data) => (data ? [[data.name, data.rating]] : [])),
  );

  const onClickSpectate = (gameId: number) => {
    onClose();
    void nav({
      to: '/spectate/$gameId',
      params: { gameId: gameId.toString() },
    });
  };

  const rows = games.map((game) => (
    <Table.Tr
      key={game.id}
      onClick={() => {
        onClickSpectate(game.id);
      }}
      className="cursor-pointer"
    >
      <Table.Td>
        <span className="font-bold">{game.white}</span> (
        {ratingByName[game.white] ?? '???'})
      </Table.Td>
      <Table.Td>
        <span className="font-bold">{game.black}</span> (
        {ratingByName[game.black] ?? '???'})
      </Table.Td>
      <Table.Td>
        {game.boardSize}x{game.boardSize}
      </Table.Td>
      <Table.Td>{game.komi / 2}</Table.Td>
      <Table.Td>
        {game.timeContingentSeconds / 60}|{game.timeIncrementSeconds}
      </Table.Td>
      <Table.Td>
        {game.pieces}/{game.capstones}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Modal opened={isOpen} onClose={onClose} title="Games" size="lg" centered>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>White</Table.Th>
            <Table.Th>Black</Table.Th>
            <Table.Th>Size</Table.Th>
            <Table.Th>Komi</Table.Th>
            <Table.Th>Time</Table.Th>
            <Table.Th>Pieces</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Modal>
  );
}
