import { ActionIcon, Modal, ScrollArea, Table, Tooltip } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useAuth, useWSAPI } from '../../authHooks';
import { useMemo } from 'react';
import { useRatings } from '../../api/ratings';
import { useSeekList, type SeekEntry } from '../../features/seeks';
import { LuSwords } from 'react-icons/lu';
import { FaTrashCan } from 'react-icons/fa6';

export function SeeksDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const seeks = useSeekList();
  const nav = useNavigate();
  const { sendMessage } = useWSAPI();
  const { user } = useAuth();

  const players = useMemo(() => {
    const playerArr = seeks.map((seek) => seek.creator);
    return playerArr.filter((p, i) => playerArr.indexOf(p) === i);
  }, [seeks]);

  const ratings = useRatings(players);
  const onClickJoin = (seekId: number) => {
    sendMessage(`Accept ${seekId.toString()}`);
    onClose();
    void nav({ to: '/play' });
  };

  const onClickCancel = () => {
    sendMessage('Seek 0 0 0 A 0 0 0 0 0 ');
  };

  const ownSeek = useMemo(() => {
    return user !== null
      ? seeks.find((s) => s.creator === user.username)
      : undefined;
  }, [seeks, user]);

  const createSeekRow = (seek: SeekEntry) => (
    <Table.Tr
      key={seek.id}
      onClick={() => {
        if (ownSeek && seek.id === ownSeek.id) return;
        onClickJoin(seek.id);
      }}
      className="cursor-pointer"
    >
      <Table.Td className="flex justify-center items-center">
        {ownSeek && seek.id === ownSeek.id ? (
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => {
              onClickCancel();
            }}
          >
            <FaTrashCan />
          </ActionIcon>
        ) : (
          <ActionIcon variant="subtle" color="gray">
            <LuSwords />
          </ActionIcon>
        )}
      </Table.Td>
      <Table.Td>
        <Tooltip
          label={`Your color will be ${seek.color === 'W' ? 'black' : seek.color === 'B' ? 'white' : 'random'}`}
        >
          <div
            style={{
              backgroundColor:
                seek.color === 'W'
                  ? 'white'
                  : seek.color === 'B'
                    ? 'black'
                    : 'clear',
            }}
            className="w-4 h-4 border rounded-full overflow-hidden flex"
          >
            {seek.color === 'A' ? (
              <>
                <div className="bg-white w-[50%] h-full" />
                <div className="bg-black w-[50%] h-full" />
              </>
            ) : null}
          </div>
        </Tooltip>
      </Table.Td>
      <Table.Td>
        <Tooltip label={`Challenge ${seek.creator}`}>
          <p className="font-bold">{seek.creator}</p>
        </Tooltip>
      </Table.Td>
      <Table.Td>{ratings[seek.creator]?.rating ?? '---'}</Table.Td>
      <Table.Td>
        {seek.boardSize}x{seek.boardSize}
      </Table.Td>
      <Table.Td>{seek.halfKomi / 2}</Table.Td>
      <Table.Td>
        {seek.timeContingent / 60}|{seek.timeIncrement}
      </Table.Td>
      <Table.Td>
        {seek.pieces}/{seek.capstones}
      </Table.Td>
    </Table.Tr>
  );

  const validSeeks = seeks.filter(
    (seek) =>
      (seek.opponent === undefined ||
        seek.opponent === '' ||
        (user !== null && seek.opponent === user.username)) &&
      (!user || seek.creator !== user.username),
  );

  const playerSeekRows = validSeeks
    .filter((s) => !s.isBot)
    .sort((a, b) => a.creator.localeCompare(b.creator))
    .map(createSeekRow);
  const botSeekRows = validSeeks
    .filter((s) => s.isBot)
    .sort((a, b) => a.creator.localeCompare(b.creator))
    .map(createSeekRow);

  const mySeekRow = ownSeek ? createSeekRow(ownSeek) : null;

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <div className="flex gap-2 items-center font-bold text-lg">
          <LuSwords size={20} />
          Join Game
        </div>
      }
      size="lg"
      centered
    >
      <ScrollArea>
        {ownSeek && (
          <>
            <p className="font-bold mt-2">Your Seek</p>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th></Table.Th>
                  <Table.Th>Color</Table.Th>
                  <Table.Th>Opponent</Table.Th>
                  <Table.Th>Rating</Table.Th>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>Komi</Table.Th>
                  <Table.Th>Time</Table.Th>
                  <Table.Th>Pieces</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{mySeekRow}</Table.Tbody>
            </Table>
          </>
        )}
        {playerSeekRows.length > 0 && (
          <>
            <p className="font-bold mt-2">Player Seeks</p>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th></Table.Th>
                  <Table.Th>Color</Table.Th>
                  <Table.Th>Opponent</Table.Th>
                  <Table.Th>Rating</Table.Th>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>Komi</Table.Th>
                  <Table.Th>Time</Table.Th>
                  <Table.Th>Pieces</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{playerSeekRows}</Table.Tbody>
            </Table>
          </>
        )}
        {botSeekRows.length > 0 && (
          <>
            <p className="font-bold mt-2">Bot Seeks</p>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th></Table.Th>
                  <Table.Th>Color</Table.Th>
                  <Table.Th>Opponent</Table.Th>
                  <Table.Th>Rating</Table.Th>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>Komi</Table.Th>
                  <Table.Th>Time</Table.Th>
                  <Table.Th>Pieces</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{botSeekRows}</Table.Tbody>
            </Table>
          </>
        )}
      </ScrollArea>
    </Modal>
  );
}
