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
import type { GameSettings, Reserve } from '../../packages/tak-core';
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
  extra?: {
    move: number;
    amountMs: number;
  } | null;
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
    extra: null,
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
          <RemoteGameTab onClose={onClose} />
        </Tabs.Panel>
        <Tabs.Panel value="local" pt="md">
          <LocalGameTab onClose={onClose} />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}

function trimNumberInput(value: string) {
  return value
    .split('')
    .filter((c) => '0123456789'.includes(c))
    .join('');
}

interface InputProps {
  disabled: boolean;
  value: string;
  onChange: (e: string) => void;
  placeholder: string;
  error?: boolean;
}

interface SelectProps {
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
  data: { value: string; label: string }[];
}

function DrivenInput({ label, props }: { label: string; props: InputProps }) {
  return (
    <TextInput
      label={label}
      disabled={props.disabled}
      value={props.value}
      onChange={(e) => {
        props.onChange(e.target.value);
      }}
      placeholder={props.placeholder}
      error={props.error}
    />
  );
}

function DrivenSelect({ label, props }: { label: string; props: SelectProps }) {
  return (
    <Select
      label={label}
      allowDeselect={false}
      disabled={props.disabled}
      data={props.data}
      value={props.value}
      onChange={(e) => {
        if (e === null) return;
        props.onChange(e);
      }}
    />
  );
}

function useExtraTimeInput(preset: Preset, hasTime: boolean) {
  const [extraTimeMove, setExtraTimeMove] = useState<number | null>(null);
  const [extraTimeAmount, setExtraTimeAmount] = useState<number | null>(null);

  const moveInput: InputProps = {
    disabled: preset.extra !== undefined || !hasTime,
    value: extraTimeMove?.toString() ?? '',
    onChange: (val: string) => {
      val = trimNumberInput(val);
      if (val === '') {
        setExtraTimeMove(null);
        return;
      }
      setExtraTimeMove(Math.max(1, parseInt(val)));
    },
    placeholder: 'None',
  };

  const amountInput: InputProps = {
    disabled: extraTimeMove === null || preset.extra !== undefined || !hasTime,
    value: extraTimeAmount?.toString() ?? '',
    onChange: (val: string) => {
      val = trimNumberInput(val);
      if (val === '') {
        setExtraTimeAmount(null);
        return;
      }
      setExtraTimeAmount(Math.max(1, parseInt(val)));
    },
    placeholder: extraTimeMove === null ? 'None' : 'Enter an amount',
    error:
      extraTimeMove !== null &&
      (extraTimeAmount === null || extraTimeAmount <= 0),
  };

  useEffect(() => {
    if (preset.extra !== undefined) {
      setExtraTimeMove(preset.extra?.move ?? null);
      setExtraTimeAmount(
        preset.extra ? preset.extra.amountMs / (60 * 1000) : null,
      );
    }
  }, [preset]);

  const value =
    extraTimeMove !== null && extraTimeAmount !== null && extraTimeAmount > 0
      ? {
          move: extraTimeMove,
          amountMs: extraTimeAmount * 60 * 1000,
        }
      : undefined;

  const valid =
    extraTimeMove === null || (extraTimeAmount !== null && extraTimeAmount > 0);

  return { value, moveInput, amountInput, valid };
}

function usePreset() {
  const [presetId, setPresetId] = useState<string>('none');
  const currentPreset = presets.find((p) => p.id === presetId) ?? defaultPreset;

  return { currentPreset, presetId, setPresetId };
}

function useGameType(currentPreset: Preset) {
  const gameTypeData = ['normal', 'unrated', 'tournament'].map((type) => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
  }));
  const [gameTypeValue, setGameTypeValue] = useState<
    'unrated' | 'normal' | 'tournament'
  >('normal');

  useEffect(() => {
    if (currentPreset.gameType !== undefined)
      setGameTypeValue(currentPreset.gameType);
  }, [currentPreset]);

  const select: SelectProps = {
    disabled: currentPreset.gameType !== undefined,
    data: gameTypeData,
    value: gameTypeValue,
    onChange: (v) => {
      if (v !== 'normal' && v !== 'unrated' && v !== 'tournament') return;
      setGameTypeValue(v);
    },
  };

  return {
    select,
    value: {
      unrated: gameTypeValue === 'unrated' ? '1' : '0',
      tournament: gameTypeValue === 'tournament' ? '1' : '0',
    },
  };
}

function useColor() {
  const colorData = [
    { value: 'A', label: 'Random' },
    { value: 'W', label: 'White' },
    { value: 'B', label: 'Black' },
  ];
  const [color, setColor] = useState<'W' | 'B' | 'A'>('A');

  const select: SelectProps = {
    disabled: false,
    data: colorData,
    value: color,
    onChange: (v) => {
      setColor(v as 'W' | 'B' | 'A');
    },
  };

  return { select, value: color };
}

function useBoardSize(currentPreset: Preset) {
  const boardSizeData = [3, 4, 5, 6, 7, 8].map((size) => ({
    value: size.toString(),
    label: `${size.toString()}x${size.toString()}`,
  }));
  const [boardSize, setBoardSize] = useState<number>(5);

  useEffect(() => {
    if (currentPreset.boardSize !== undefined)
      setBoardSize(currentPreset.boardSize);
  }, [currentPreset]);

  const select: SelectProps = {
    disabled: currentPreset.boardSize !== undefined,
    data: boardSizeData,
    value: boardSize.toString(),
    onChange: (v) => {
      setBoardSize(parseInt(v));
    },
  };

  return { select, value: boardSize };
}

function useOpponent(currentPreset: Preset) {
  const [opponent, setOpponent] = useState<string>('');

  const input: InputProps = {
    disabled: false,
    value: opponent,
    onChange: (val) => {
      setOpponent(val.trim().replace(/\s+/g, ''));
    },
    placeholder:
      currentPreset.requiresOpponent === true && opponent.trim() === ''
        ? ''
        : 'Anyone',
    error: currentPreset.requiresOpponent === true && opponent.trim() === '',
  };

  return { input, value: opponent };
}

function useTime(currentPreset: Preset, requireTime: boolean) {
  const [timeMinutes, setTime] = useState<number | null>(10);
  const [incrementSeconds, setIncrement] = useState<number | null>(0);

  useEffect(() => {
    if (currentPreset.time !== undefined) setTime(currentPreset.time);
    if (currentPreset.increment !== undefined)
      setIncrement(currentPreset.increment);
  }, [currentPreset]);

  const timeInput: InputProps = {
    disabled: currentPreset.time !== undefined,
    value: timeMinutes?.toString() ?? '',
    onChange: (val) => {
      val = trimNumberInput(val);
      if (val === '') {
        setTime(null);
        return;
      }
      setTime(Math.max(1, parseInt(val)));
    },
    placeholder: requireTime ? 'Enter a time' : 'None',
    error: requireTime && timeMinutes === null,
  };

  const incrementInput: InputProps = {
    disabled: currentPreset.increment !== undefined || timeMinutes === null,
    value: incrementSeconds?.toString() ?? '',
    onChange: (val) => {
      val = trimNumberInput(val);
      if (val === '') {
        setIncrement(null);
        return;
      }
      setIncrement(parseInt(val));
    },
    placeholder: !requireTime && timeMinutes === null ? 'None' : '0',
  };

  return {
    value:
      timeMinutes !== null && timeMinutes > 0
        ? { timeMinutes, incrementSeconds: incrementSeconds ?? 0 }
        : null,
    timeInput,
    incrementInput,
  };
}

function useKomi(currentPreset: Preset) {
  const komiData = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((halfKomi) => ({
    value: halfKomi.toString(),
    label: (halfKomi / 2).toFixed(1),
  }));
  const [halfKomi, setHalfKomi] = useState<number>(0);

  useEffect(() => {
    if (currentPreset.halfKomi !== undefined)
      setHalfKomi(currentPreset.halfKomi);
  }, [currentPreset]);

  const select: SelectProps = {
    disabled: currentPreset.halfKomi !== undefined,
    data: komiData,
    value: halfKomi.toString(),
    onChange: (v) => {
      setHalfKomi(parseInt(v));
    },
  };

  return { select, value: halfKomi };
}

function useReserve(boardSize: number, currentPreset: Preset) {
  const [stones, setStones] = useState<number | null>(null);
  const [capstones, setCapstones] = useState<number | null>(null);

  const defaultPieces = getDefaultReserve(boardSize);

  useEffect(() => {
    if (currentPreset.reserve !== undefined) {
      setStones(currentPreset.reserve.pieces);
      setCapstones(currentPreset.reserve.capstones);
    }
  }, [currentPreset]);

  const stonesInput: InputProps = {
    disabled: currentPreset.reserve !== undefined,
    value: stones?.toString() ?? '',
    onChange: (val) => {
      val = trimNumberInput(val);
      if (val === '') {
        setStones(null);
        return;
      }
      setStones(Math.max(1, parseInt(val)));
    },
    placeholder: `Default (${defaultPieces.pieces.toString()})`,
  };

  const capstonesInput: InputProps = {
    disabled: currentPreset.reserve !== undefined,
    value: capstones?.toString() ?? '',
    onChange: (val) => {
      val = trimNumberInput(val);
      if (val === '') {
        setCapstones(null);
        return;
      }
      setCapstones(Math.max(0, parseInt(val)));
    },
    placeholder: `Default (${defaultPieces.capstones.toString()})`,
  };

  const reserve: Reserve = {
    pieces: stones ?? defaultPieces.pieces,
    capstones: capstones ?? defaultPieces.capstones,
  };

  return {
    stonesInput,
    capstonesInput,
    value: reserve,
  };
}

function RemoteGameTab({ onClose }: { onClose: () => void }) {
  const { sendMessage } = useWSAPI();

  const { currentPreset, presetId, setPresetId } = usePreset();

  const { select: gameTypeSelect, value: gameTypeValue } =
    useGameType(currentPreset);
  const { select: colorSelect, value: colorValue } = useColor();
  const { select: boardSizeSelect, value: boardSizeValue } =
    useBoardSize(currentPreset);
  const { input: opponentInput, value: opponentValue } =
    useOpponent(currentPreset);
  const {
    value: timeValue,
    timeInput,
    incrementInput,
  } = useTime(currentPreset, true);
  const { select: komiSelect, value: halfKomiValue } = useKomi(currentPreset);
  const {
    value: extraValue,
    amountInput,
    moveInput: extraMoveInput,
    valid: extraValid,
  } = useExtraTimeInput(currentPreset, timeValue !== null);
  const {
    stonesInput,
    capstonesInput,
    value: reserveValue,
  } = useReserve(boardSizeValue, currentPreset);

  const validRemote =
    timeValue !== null &&
    (currentPreset.requiresOpponent !== true || opponentValue !== '') &&
    extraValid;

  const onClickCreate = () => {
    if (!validRemote) return;
    const capstonesVal = reserveValue.capstones.toString();
    const stonesVal = reserveValue.pieces.toString();
    const unratedVal = gameTypeValue.unrated;
    const tournamentVal = gameTypeValue.tournament;
    const timeVal = (timeValue.timeMinutes * 60).toString();
    const incrementVal = timeValue.incrementSeconds.toString();
    const extraTimeMoveVal = extraValue?.move.toString() ?? '0';
    const extraTimeAmountVal = ((extraValue?.amountMs ?? 0) / 1000).toString();
    const opponentVal = opponentValue.trim();
    const seekString = `Seek ${boardSizeValue.toString()} ${timeVal} ${incrementVal} ${colorValue} ${halfKomiValue.toString()} ${stonesVal} ${capstonesVal} ${unratedVal} ${tournamentVal} ${extraTimeMoveVal} ${extraTimeAmountVal} ${opponentVal}`;
    sendMessage(seekString);
    onClose();
  };

  return (
    <>
      <Grid>
        <Grid.Col span={6}>
          <Stack>
            <DrivenInput label="Opponent" props={opponentInput} />
            <DrivenSelect label="My Color" props={colorSelect} />
            <DrivenSelect label="Board Size" props={boardSizeSelect} />
            <DrivenInput label="Time (minutes per player)" props={timeInput} />
            <DrivenInput label="Extra Time Move" props={extraMoveInput} />
            <DrivenInput label="Stones" props={stonesInput} />
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
            <DrivenSelect label="Game Type" props={gameTypeSelect} />
            <DrivenSelect label="Komi" props={komiSelect} />
            <DrivenInput label="Increment (seconds)" props={incrementInput} />
            <DrivenInput
              label="Extra Time Amount (minutes)"
              props={amountInput}
            />
            <DrivenInput label="Capstones" props={capstonesInput} />
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
          disabled={!validRemote}
        >
          Create Game
        </Button>
      </Flex>
    </>
  );
}

function LocalGameTab({ onClose }: { onClose: () => void }) {
  const { select: boardSizeSelect, value: boardSizeValue } =
    useBoardSize(defaultPreset);
  const {
    value: timeValue,
    timeInput,
    incrementInput,
  } = useTime(defaultPreset, false);

  const { select: komiSelect, value: halfKomiValue } = useKomi(defaultPreset);

  const {
    value: extraValue,
    amountInput,
    moveInput: extraMoveInput,
  } = useExtraTimeInput(defaultPreset, timeValue !== null);
  const {
    stonesInput,
    capstonesInput,
    value: reserveValue,
  } = useReserve(boardSizeValue, defaultPreset);

  const onClickCreate = () => {
    const settings: GameSettings = {
      boardSize: boardSizeValue,
      halfKomi: halfKomiValue,
      reserve: reserveValue,
      clock:
        timeValue !== null
          ? {
              contingentMs: timeValue.timeMinutes * 60 * 1000,
              incrementMs: timeValue.incrementSeconds * 1000,
              extra: extraValue,
            }
          : undefined,
    };
    newLocalGame(settings);
    onClose();
    void router.navigate({ to: '/scratch' });
  };

  return (
    <>
      <Grid>
        <Grid.Col span={6}>
          <Stack>
            <DrivenSelect label="Board Size" props={boardSizeSelect} />
            <DrivenInput label="Time (minutes per player)" props={timeInput} />
            <DrivenInput label="Extra Time Move" props={extraMoveInput} />
            <DrivenInput label="Stones" props={stonesInput} />
          </Stack>
        </Grid.Col>
        <Grid.Col span={6}>
          <Stack>
            <DrivenSelect label="Komi" props={komiSelect} />
            <DrivenInput label="Increment (seconds)" props={incrementInput} />
            <DrivenInput
              label="Extra Time Amount (minutes)"
              props={amountInput}
            />
            <DrivenInput label="Capstones" props={capstonesInput} />
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
        >
          Create Game
        </Button>
      </Flex>
    </>
  );
}
