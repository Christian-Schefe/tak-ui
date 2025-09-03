import { Modal, ScrollArea, Table } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useRatings } from '../../api/ratings';
import { useGamesList } from '../../features/gameList';
import { FaEye } from 'react-icons/fa6';

export function SpectateDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const games = useGamesList();
  const nav = useNavigate();

  const players = useMemo(() => {
    const playerArr = games.flatMap((game) => [game.white, game.black]);
    return playerArr.filter((p, i) => playerArr.indexOf(p) === i);
  }, [games]);

  const ratings = useRatings(players);

  const onClickSpectate = (gameId: number) => {
    onClose();
    void nav({
      to: '/spectate/$gameId',
      params: { gameId: gameId.toString() },
    });
  };

  const rows = games.map((game) => {
    const whiteRating = ratings[game.white]?.rating;
    const blackRating = ratings[game.black]?.rating;
    return (
      <Table.Tr
        key={game.id}
        onClick={() => {
          onClickSpectate(game.id);
        }}
        className="cursor-pointer"
      >
        <Table.Td>
          <span className="font-bold">{game.white}</span>
          {whiteRating !== undefined ? ` (${whiteRating.toString()})` : ''}
        </Table.Td>
        <Table.Td>
          <span className="font-bold">{game.black}</span>
          {blackRating !== undefined ? ` (${blackRating.toString()})` : ''}
        </Table.Td>
        <Table.Td>
          {game.boardSize}x{game.boardSize}
        </Table.Td>
        <Table.Td>{game.halfKomi / 2}</Table.Td>
        <Table.Td>
          {game.timeContingentSeconds / 60}|{game.timeIncrementSeconds}
        </Table.Td>
        <Table.Td>
          {game.pieces}/{game.capstones}
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <div className="flex gap-2 items-center font-bold text-lg">
          <FaEye size={20} />
          Watch Game
        </div>
      }
      size="lg"
      centered
    >
      <ScrollArea>
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
      </ScrollArea>
    </Modal>
  );
}
