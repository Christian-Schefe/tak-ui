import {
  Modal,
  Select,
  Slider,
  Switch,
  useMantineColorScheme,
} from '@mantine/core';
import { themes, type ColorTheme } from '../../assets/2d-themes';
import {
  useSettings,
  type BoardType,
  type Ninja2DThemes,
} from '../../settings';
import { FaGear } from 'react-icons/fa6';

interface ThemeOption {
  value: ColorTheme;
  label: string;
}

const ninja2DNames: Record<Ninja2DThemes, string> = {
  aaron: 'Aaron',
  aer: 'Aer',
  aether: 'Aether',
  aqua: 'Aqua',
  atlas: 'Atlas',
  backlit: 'Backlit',
  bubbletron: 'BubbleTron',
  classic: 'Classic',
  discord: 'Discord',
  essence: 'Essence',
  fresh: 'Fresh',
  ignis: 'Ignis',
  luna: 'Luna',
  paper: 'Paper',
  retro: 'Retro',
  stealth: 'Stealth',
  terra: 'Terra',
  zen: 'Zen',
};

export function SettingsDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    boardType,
    setBoardType,
    volume,
    boardSettings: { board2d: board2dSettings, boardNinja: boardNinjaSettings },
    setBoardSettings: {
      board2d: setBoard2dSettings,
      boardNinja: setBoardNinjaSettings,
    },
    devMode: devMove,
  } = useSettings();

  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const themeOptions: ThemeOption[] = Object.keys(themes).map((colorTheme) => ({
    value: colorTheme as ColorTheme,
    label: colorTheme.charAt(0).toUpperCase() + colorTheme.slice(1),
  }));

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="lg"
      centered
      title={
        <div className="flex gap-2 items-center font-bold text-lg">
          <FaGear size={20} />
          Settings
        </div>
      }
    >
      <div className="p-2 flex flex-col gap-2">
        <p className="mt-4">Color Scheme</p>
        <Select
          value={colorScheme}
          allowDeselect={false}
          onChange={(value) => {
            setColorScheme(value as 'light' | 'dark' | 'auto');
          }}
          data={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto' },
          ]}
        />
        <p className="mt-4">Volume</p>
        <Slider
          value={Math.round(volumeToLinear(volume.value))}
          onChange={(value) => {
            volume.setValue(volumeToLogarithmic(value));
          }}
          min={0}
          max={100}
          step={1}
        />
        <p className="mt-4">Board Type</p>
        <Select
          value={boardType}
          allowDeselect={false}
          onChange={(value) => {
            setBoardType(value as BoardType);
          }}
          data={[
            { value: '2d', label: '2D (Native)' },
            { value: 'ninja', label: '2D (PTN Ninja)' },
            { value: '3d', label: '3D' },
          ]}
        />
        {boardType === '2d' && (
          <>
            <p className="mt-4">Color Theme</p>
            <Select
              value={board2dSettings.colorTheme}
              allowDeselect={false}
              onChange={(e) => {
                setBoard2dSettings({
                  ...board2dSettings,
                  colorTheme: (e ?? 'classic') as ColorTheme,
                });
              }}
              data={themeOptions}
            />
            <p className="mt-4">Animation Duration</p>
            <Slider
              label={`${board2dSettings.animationSpeed.toString()} ms`}
              value={board2dSettings.animationSpeed}
              onChange={(value) => {
                setBoard2dSettings({
                  ...board2dSettings,
                  animationSpeed: value,
                });
              }}
              min={10}
              max={500}
              step={10}
            />
            <p className="mt-4">Piece Size</p>
            <Slider
              value={board2dSettings.pieceSize}
              onChange={(value) => {
                setBoard2dSettings({
                  ...board2dSettings,
                  pieceSize: value,
                });
              }}
              min={40}
              max={70}
              step={1}
            />
            <p className="mt-4">Axis Labels</p>
            <div className="flex gap-2 items-center">
              <Switch
                checked={board2dSettings.axisLabels}
                onChange={(e) => {
                  setBoard2dSettings({
                    ...board2dSettings,
                    axisLabels: e.currentTarget.checked,
                  });
                }}
              />
              <Slider
                style={{ flexGrow: 1 }}
                value={board2dSettings.axisLabelSize}
                disabled={!board2dSettings.axisLabels}
                onChange={(value) => {
                  setBoard2dSettings({
                    ...board2dSettings,
                    axisLabelSize: value,
                  });
                }}
                min={8}
                max={24}
                step={1}
              />
            </div>
          </>
        )}
        {boardType === 'ninja' && (
          <>
            <p className="mt-4">Color Theme</p>
            <Select
              value={boardNinjaSettings.colorTheme}
              allowDeselect={false}
              onChange={(e) => {
                setBoardNinjaSettings({
                  ...boardNinjaSettings,
                  colorTheme: (e ?? 'classic') as Ninja2DThemes,
                });
              }}
              data={Object.entries(ninja2DNames).map(([id, name]) => ({
                value: id,
                label: name,
              }))}
            />
            <p className="mt-4">Axis Labels</p>
            <Select
              value={boardNinjaSettings.axisLabels}
              allowDeselect={false}
              onChange={(e) => {
                setBoardNinjaSettings({
                  ...boardNinjaSettings,
                  axisLabels: (e ?? 'normal') as 'normal' | 'small' | 'none',
                });
              }}
              data={[
                { value: 'normal', label: 'Normal' },
                { value: 'small', label: 'Small' },
                { value: 'none', label: 'None' },
              ]}
            />
          </>
        )}
        <p className="mt-4">Dev Mode</p>
        <Switch
          checked={devMove.value}
          onChange={(e) => {
            devMove.setValue(e.currentTarget.checked);
          }}
        />
      </div>
    </Modal>
  );
}

function volumeToLogarithmic(volume: number) {
  return Math.pow(volume / 100, 2) * 100;
}

function volumeToLinear(volume: number) {
  return Math.pow(volume / 100, 0.5) * 100;
}
