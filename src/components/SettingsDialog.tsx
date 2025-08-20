import { themes, type ColorTheme } from '../assets/2d-themes';
import { useSettings } from '../settings';
import { Modal, type ModalInheritedProps } from './Modal';
import Select from 'react-select';

interface ThemeOption {
  value: ColorTheme;
  label: string;
}

export function SettingsDialog({ isOpen, onClose }: ModalInheritedProps) {
  const { boardType, setBoardType, colorTheme, setColorTheme } = useSettings();

  if (!isOpen) return null;

  const themeOptions: ThemeOption[] = Object.keys(themes).map((colorTheme) => ({
    value: colorTheme as ColorTheme,
    label: colorTheme.charAt(0).toUpperCase() + colorTheme.slice(1),
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="p-4 rounded-lg flex flex-col gap-2"
    >
      <h1 className="font-bold text-lg text-center">Settings</h1>
      <div className="flex items-center gap-2">
        <p>Board Type:</p>
        <button
          onClick={() => {
            setBoardType('2d');
          }}
          className={`py-2 px-4 m-1 bg-surface-500 hover:bg-surface-550 outline-primary-500 rounded-md ${boardType === '2d' ? 'outline-2' : ''}`}
        >
          2D
        </button>
        <button
          onClick={() => {
            setBoardType('3d');
          }}
          className={`py-2 px-4 m-1 bg-surface-500 hover:bg-surface-550 outline-primary-500 rounded-md ${boardType === '3d' ? 'outline-2' : ''}`}
        >
          3D
        </button>
      </div>
      <div className="flex items-center gap-2">
        <p>Color Theme:</p>
        <Select
          value={
            themeOptions.find((option) => option.value === colorTheme) ?? null
          }
          onChange={(e) => {
            setColorTheme(e?.value ?? 'classic');
          }}
          options={themeOptions}
          styles={{
            option: (provided, state) => ({
              ...provided,
              color: state.isSelected ? 'white' : 'black',
              backgroundColor: state.isSelected
                ? 'var(--color-primary-600)'
                : provided.backgroundColor,
            }),
          }}
        />
      </div>
    </Modal>
  );
}
