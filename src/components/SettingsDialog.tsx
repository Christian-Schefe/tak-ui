import {
  Modal,
  Select,
  Slider,
  Switch,
  useMantineColorScheme,
} from '@mantine/core';
import { themes, type ColorTheme } from '../assets/2d-themes';
import { useSettings } from '../settings';

interface ThemeOption {
  value: ColorTheme;
  label: string;
}

export function SettingsDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { boardType, setBoardType, board2dSettings, setBoard2dSettings } =
    useSettings();

  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const themeOptions: ThemeOption[] = Object.keys(themes).map((colorTheme) => ({
    value: colorTheme as ColorTheme,
    label: colorTheme.charAt(0).toUpperCase() + colorTheme.slice(1),
  }));

  return (
    <Modal opened={isOpen} onClose={onClose} centered title="Settings">
      <p className="mt-4">Color Scheme</p>
      <Select
        value={colorScheme}
        onChange={(value) => {
          setColorScheme(value as 'light' | 'dark' | 'auto');
        }}
        data={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'auto', label: 'Auto' },
        ]}
      />
      <p className="mt-4">3D Board</p>
      <Switch
        checked={boardType === '3d'}
        onChange={(e) => {
          setBoardType(e.currentTarget.checked ? '3d' : '2d');
        }}
      />
      {boardType === '2d' && (
        <>
          <p className="mt-4">Color Theme</p>
          <Select
            value={board2dSettings.colorTheme}
            onChange={(e) => {
              setBoard2dSettings({
                ...board2dSettings,
                colorTheme: (e ?? 'classic') as ColorTheme,
              });
            }}
            data={themeOptions}
          />
          <p className="mt-4">Axis Labels</p>
          <Switch
            checked={board2dSettings.axisLabels}
            onChange={(e) => {
              setBoard2dSettings({
                ...board2dSettings,
                axisLabels: e.currentTarget.checked,
              });
            }}
          />
          {board2dSettings.axisLabels && (
            <>
              <p className="mt-4">Axis Label Size</p>
              <Slider
                value={board2dSettings.axisLabelSize}
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
            </>
          )}
        </>
      )}
    </Modal>
  );
}
