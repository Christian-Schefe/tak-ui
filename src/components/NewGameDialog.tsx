import {
  Button,
  Flex,
  Grid,
  Input,
  InputWrapper,
  Modal,
  Select,
  Stack,
} from '@mantine/core';
import { useWSAPI } from '../authHooks';
import { useState } from 'react';
import { defaultReserve } from '../packages/tak-core/piece';

export function NewGameDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { sendMessage } = useWSAPI();

  const [opponent, setOpponent] = useState<string>('');

  const colorData = [
    { value: 'A', label: 'Random' },
    { value: 'W', label: 'White' },
    { value: 'B', label: 'Black' },
  ];
  const [color, setColor] = useState<'W' | 'B' | 'A'>('A');

  const boardSizeData = [3, 4, 5, 6, 7, 8].map((size) => ({
    value: size.toString(),
    label: `${size.toString()}x${size.toString()}`,
  }));
  const [boardSize, setBoardSize] = useState<number>(5);

  const komiData = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((halfKomi) => ({
    value: halfKomi.toString(),
    label: (halfKomi / 2).toFixed(1),
  }));
  const [halfKomi, setHalfKomi] = useState<number>(0);

  const gameType = ['normal', 'unrated', 'tournament'].map((type) => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
  }));
  const [gameTypeValue, setGameTypeValue] = useState<
    'unrated' | 'normal' | 'tournament'
  >('normal');

  const [time, setTime] = useState<number | null>(10);
  const [increment, setIncrement] = useState<number | null>(0);
  const [extraTimeMove, setExtraTimeMove] = useState<number | null>(null);
  const [extraTimeAmount, setExtraTimeAmount] = useState<number | null>(0);
  const [stones, setStones] = useState<number | null>(null);
  const [capstones, setCapstones] = useState<number | null>(null);

  const defaultPieces = defaultReserve(boardSize);

  const valid = !!time;

  const onClickCreate = () => {
    if (!valid) return;
    const seekString = `Seek ${boardSize.toString()} ${(time * 60).toString()} ${increment?.toString() ?? '0'} ${color} ${halfKomi.toString()} ${(stones ?? defaultPieces.pieces).toString()} ${(capstones ?? defaultPieces.capstones).toString()} ${gameTypeValue === 'unrated' ? '1' : '0'} ${gameTypeValue === 'tournament' ? '1' : '0'} ${extraTimeMove?.toString() ?? '0'} ${((extraTimeAmount ?? 0) * 60).toString()} ${opponent}`;
    sendMessage(seekString);
  };

  return (
    <Modal opened={isOpen} onClose={onClose} title="Seeks" size="lg" centered>
      <Grid>
        <Grid.Col span={6}>
          <Stack>
            <InputWrapper label="Opponent">
              <Input
                placeholder="Anyone"
                value={opponent}
                onChange={(e) => {
                  setOpponent(e.target.value);
                }}
              />
            </InputWrapper>
            <InputWrapper label="My Color">
              <Select
                data={colorData}
                value={color}
                onChange={(v) => {
                  if (!v) return;
                  setColor(v as 'W' | 'B' | 'A');
                }}
              />
            </InputWrapper>
            <InputWrapper label="Board Size">
              <Select
                data={boardSizeData}
                value={boardSize.toString()}
                onChange={(v) => {
                  if (!v) return;
                  setBoardSize(parseInt(v));
                }}
              />
            </InputWrapper>
            <InputWrapper label="Time (minutes per player)">
              <Input
                value={time?.toString() ?? ''}
                onChange={(e) => {
                  e.target.value = e.target.value
                    .split('')
                    .filter((c) => '0123456789'.includes(c))
                    .join('');
                  if (e.target.value === '') {
                    setTime(null);
                    return;
                  }
                  setTime(Math.max(1, parseInt(e.target.value)));
                }}
                placeholder="Enter a time"
                error={time === null}
              />
            </InputWrapper>
            <InputWrapper label="Extra Time Move">
              <Input
                value={extraTimeMove?.toString() ?? ''}
                onChange={(e) => {
                  e.target.value = e.target.value
                    .split('')
                    .filter((c) => '0123456789'.includes(c))
                    .join('');
                  if (e.target.value === '') {
                    setExtraTimeMove(null);
                    return;
                  }
                  setExtraTimeMove(Math.max(1, parseInt(e.target.value)));
                }}
                placeholder="None"
              />
            </InputWrapper>
            <InputWrapper label="Stones">
              <Input
                value={stones?.toString() ?? ''}
                onChange={(e) => {
                  e.target.value = e.target.value
                    .split('')
                    .filter((c) => '0123456789'.includes(c))
                    .join('');
                  if (e.target.value === '') {
                    setStones(null);
                    return;
                  }
                  setStones(Math.max(1, parseInt(e.target.value)));
                }}
                placeholder={`Default (${defaultPieces.pieces.toString()})`}
              />
            </InputWrapper>
          </Stack>
        </Grid.Col>
        <Grid.Col span={6}>
          <Stack>
            <InputWrapper label="Presets">
              <Select />
            </InputWrapper>
            <InputWrapper label="Game Type">
              <Select
                data={gameType}
                value={gameTypeValue}
                onChange={(v) => {
                  if (
                    !v ||
                    (v !== 'normal' && v !== 'unrated' && v !== 'tournament')
                  )
                    return;
                  setGameTypeValue(v);
                }}
              />
            </InputWrapper>
            <InputWrapper label="Komi">
              <Select
                data={komiData}
                value={halfKomi.toString()}
                onChange={(v) => {
                  if (!v) return;
                  setHalfKomi(parseInt(v));
                }}
              />
            </InputWrapper>
            <InputWrapper label="Increment (seconds)">
              <Input
                value={increment?.toString() ?? ''}
                onChange={(e) => {
                  e.target.value = e.target.value
                    .split('')
                    .filter((c) => '0123456789'.includes(c))
                    .join('');
                  if (e.target.value === '') {
                    setIncrement(null);
                    return;
                  }
                  setIncrement(parseInt(e.target.value));
                }}
                placeholder="0"
              />
            </InputWrapper>
            <InputWrapper label="Extra Time Amount (minutes)">
              <Input
                value={extraTimeAmount?.toString() ?? ''}
                onChange={(e) => {
                  e.target.value = e.target.value
                    .split('')
                    .filter((c) => '0123456789'.includes(c))
                    .join('');
                  if (e.target.value === '') {
                    setExtraTimeAmount(null);
                    return;
                  }
                  setExtraTimeAmount(parseInt(e.target.value));
                }}
                disabled={extraTimeMove === null}
                placeholder="0"
              />
            </InputWrapper>
            <InputWrapper label="Capstones">
              <Input
                value={capstones?.toString() ?? ''}
                onChange={(e) => {
                  e.target.value = e.target.value
                    .split('')
                    .filter((c) => '0123456789'.includes(c))
                    .join('');
                  if (e.target.value === '') {
                    setCapstones(null);
                    return;
                  }
                  setCapstones(parseInt(e.target.value));
                }}
                placeholder={`Default (${defaultPieces.capstones.toString()})`}
              />
            </InputWrapper>
          </Stack>
        </Grid.Col>
      </Grid>
      <Flex justify="flex-end" mt="md" gap="md">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onClickCreate();
          }}
          disabled={!valid}
        >
          Create Game
        </Button>
      </Flex>
    </Modal>
  );
}
