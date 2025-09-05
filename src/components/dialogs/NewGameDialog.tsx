import {
  Button,
  Flex,
  Grid,
  Modal,
  Select,
  Stack,
  Tabs,
  TextInput,
} from '@mantine/core';
import { useWSAPI } from '../../authHooks';
import { useEffect, useState } from 'react';
import { getDefaultReserve } from '../../packages/tak-core/piece';
import { FaPlus } from 'react-icons/fa6';
import type { GameSettings } from '../../packages/tak-core';
import { newLocalGame } from '../../features/localGame';
import { router } from '../../router';

interface Preset {
  name: string;
  id: string;
  halfKomi?: number;
  boardSize?: number;
  reserve?: { pieces: number; capstones: number };
  time?: number;
  increment?: number;
  gameType?: 'normal' | 'unrated' | 'tournament';
  extraTimeMove?: number;
  extraTimeAmount?: number;
  requiresOpponent?: boolean;
}

const defaultPreset: Preset = {
  name: 'None',
  id: 'none',
};

const presets: Preset[] = [
  defaultPreset,
  {
    name: 'Beginner Tournament',
    id: 'beginner-tournament',
    halfKomi: 4,
    boardSize: 6,
    reserve: { pieces: 30, capstones: 1 },
    time: 15,
    increment: 10,
    gameType: 'tournament',
    extraTimeAmount: 0,
    extraTimeMove: 0,
    requiresOpponent: true,
  },
];

const presetData = presets.map((preset) => ({
  value: preset.id,
  label: preset.name,
}));

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
  const [presetId, setPresetId] = useState<string>('none');

  const defaultPieces = getDefaultReserve(boardSize);

  const currentPreset = presets.find((p) => p.id === presetId) ?? defaultPreset;

  const valid =
    time !== null &&
    time > 0 &&
    (currentPreset.requiresOpponent !== true || opponent !== '');

  useEffect(() => {
    if (currentPreset.boardSize !== undefined)
      setBoardSize(currentPreset.boardSize);
    if (currentPreset.halfKomi !== undefined)
      setHalfKomi(currentPreset.halfKomi);
    if (currentPreset.reserve !== undefined) {
      setStones(currentPreset.reserve.pieces);
      setCapstones(currentPreset.reserve.capstones);
    }
    if (currentPreset.time !== undefined) setTime(currentPreset.time);
    if (currentPreset.increment !== undefined)
      setIncrement(currentPreset.increment);
    if (currentPreset.gameType !== undefined)
      setGameTypeValue(currentPreset.gameType);
    if (currentPreset.extraTimeMove !== undefined)
      setExtraTimeMove(currentPreset.extraTimeMove);
    if (currentPreset.extraTimeAmount !== undefined)
      setExtraTimeAmount(currentPreset.extraTimeAmount);
  }, [currentPreset]);

  const onClickCreate = () => {
    if (!valid) return;
    const capstonesVal = (capstones ?? defaultPieces.capstones).toString();
    const stonesVal = (stones ?? defaultPieces.pieces).toString();
    const unratedVal = gameTypeValue === 'unrated' ? '1' : '0';
    const tournamentVal = gameTypeValue === 'tournament' ? '1' : '0';
    const timeVal = (time * 60).toString();
    const incrementVal = increment?.toString() ?? '0';
    const extraTimeMoveVal = extraTimeMove?.toString() ?? '0';
    const extraTimeAmountVal = (
      (extraTimeMove !== null ? (extraTimeAmount ?? 0) : 0) * 60
    ).toString();
    const opponentVal = opponent.trim();
    const seekString = `Seek ${boardSize.toString()} ${timeVal} ${incrementVal} ${color} ${halfKomi.toString()} ${stonesVal} ${capstonesVal} ${unratedVal} ${tournamentVal} ${extraTimeMoveVal} ${extraTimeAmountVal} ${opponentVal}`;
    sendMessage(seekString);
    onClose();
  };

  const onClickCreateLocal = () => {
    if (!valid) return;
    const settings: GameSettings = {
      boardSize,
      halfKomi,
      reserve: {
        pieces: stones ?? defaultPieces.pieces,
        capstones: capstones ?? defaultPieces.capstones,
      },
    };
    newLocalGame(settings);
    onClose();
    void router.navigate({ to: '/scratch' });
  };

  const boardSizeSelect = (
    <Select
      label="Board Size"
      disabled={currentPreset.boardSize !== undefined}
      data={boardSizeData}
      value={boardSize.toString()}
      onChange={(v) => {
        if (v === null) return;
        setBoardSize(parseInt(v));
      }}
    />
  );

  const komiSelect = (
    <Select
      label="Komi"
      disabled={currentPreset.halfKomi !== undefined}
      data={komiData}
      value={halfKomi.toString()}
      onChange={(v) => {
        if (v === null) return;
        setHalfKomi(parseInt(v));
      }}
    />
  );

  const stonesInput = (
    <TextInput
      label="Stones"
      disabled={currentPreset.reserve !== undefined}
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
  );

  const capstonesInput = (
    <TextInput
      label="Capstones"
      disabled={currentPreset.reserve !== undefined}
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
  );

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <div className="flex gap-2 items-center font-bold text-lg">
          <FaPlus size={20} />
          New Game
        </div>
      }
      size="lg"
      centered
    >
      <Tabs defaultValue="remote">
        <Tabs.List>
          <Tabs.Tab value="remote">Create Seek</Tabs.Tab>
          <Tabs.Tab value="local">Play Local</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="remote" pt="md">
          <Grid>
            <Grid.Col span={6}>
              <Stack>
                <TextInput
                  label="Opponent"
                  placeholder={
                    currentPreset.requiresOpponent === true &&
                    opponent.trim() === ''
                      ? ''
                      : 'Anyone'
                  }
                  value={opponent}
                  onChange={(e) => {
                    setOpponent(e.target.value.trim().replace(/\s+/g, ''));
                  }}
                  error={
                    currentPreset.requiresOpponent === true &&
                    opponent.trim() === ''
                  }
                />
                <Select
                  label="My Color"
                  data={colorData}
                  value={color}
                  onChange={(v) => {
                    if (v === null) return;
                    setColor(v as 'W' | 'B' | 'A');
                  }}
                />
                {boardSizeSelect}
                <TextInput
                  label="Time (minutes per player)"
                  disabled={currentPreset.time !== undefined}
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
                <TextInput
                  label="Extra Time Move"
                  disabled={currentPreset.extraTimeMove !== undefined}
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
                {stonesInput}
              </Stack>
            </Grid.Col>
            <Grid.Col span={6}>
              <Stack>
                <Select
                  label="Preset"
                  data={presetData}
                  value={presetId}
                  onChange={(e) => {
                    setPresetId(e ?? 'none');
                  }}
                />
                <Select
                  label="Game Type"
                  disabled={currentPreset.gameType !== undefined}
                  data={gameType}
                  value={gameTypeValue}
                  onChange={(v) => {
                    if (v !== 'normal' && v !== 'unrated' && v !== 'tournament')
                      return;
                    setGameTypeValue(v);
                  }}
                />
                {komiSelect}
                <TextInput
                  label="Increment (seconds)"
                  disabled={currentPreset.increment !== undefined}
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
                <TextInput
                  label="Extra Time Amount (minutes)"
                  disabled={
                    extraTimeMove === null ||
                    currentPreset.extraTimeAmount !== undefined
                  }
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
                  placeholder="0"
                />
                {capstonesInput}
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
        </Tabs.Panel>
        <Tabs.Panel value="local" pt="md">
          <Grid>
            <Grid.Col span={6}>
              <Stack>
                {boardSizeSelect}
                {stonesInput}
              </Stack>
            </Grid.Col>
            <Grid.Col span={6}>
              <Stack>
                {komiSelect}
                {capstonesInput}
              </Stack>
            </Grid.Col>
          </Grid>
          <Flex justify="flex-end" mt="md" gap="md">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onClickCreateLocal();
              }}
              disabled={!valid}
            >
              Create Local
            </Button>
          </Flex>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
