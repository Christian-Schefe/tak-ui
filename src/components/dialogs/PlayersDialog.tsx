import { Modal, ScrollArea, Table } from '@mantine/core';
import { useAuth } from '../../authHooks';
import { useMemo } from 'react';
import { useRatings } from '../../api/ratings';
import { usePlayerList } from '../../features/players';
import { FaUsers } from 'react-icons/fa6';

export function PlayersDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const players = usePlayerList();
  const auth = useAuth();

  const playerNames = useMemo(() => {
    return players.map((player) => player.username);
  }, [players]);

  const ratings = useRatings(playerNames);

  const rows = players
    .sort((a, b) => a.username.localeCompare(b.username))
    .filter((player) => player.username !== auth.user?.username)
    .map((player) => (
      <Table.Tr key={player.username} className="cursor-pointer">
        <Table.Td>{player.username}</Table.Td>
        <Table.Td>{ratings[player.username]?.rating ?? '---'}</Table.Td>
      </Table.Tr>
    ));

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <div className="flex gap-2 items-center font-bold text-lg">
          <FaUsers size={20} />
          Online Players
        </div>
      }
      size="lg"
      centered
    >
      <ScrollArea>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Username</Table.Th>
              <Table.Th>Rating</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </Modal>
  );
}
