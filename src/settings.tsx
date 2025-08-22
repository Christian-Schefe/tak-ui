import { createContext, use, useMemo } from 'react';
import { useLocalStorage } from 'react-use';
import { themes, type ColorTheme, type ThemeParams } from './assets/2d-themes';

export type BoardType = '2d' | '3d';

export interface Board2DSettings {
  colorTheme: ColorTheme;
  axisLabels: boolean;
  axisLabelSize: number;
}

export type Setter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;

export interface SettingsState {
  boardType: BoardType;
  board2dSettings: Board2DSettings;
  themeParams: ThemeParams;
  setBoardType: Setter<BoardType>;
  setBoard2dSettings: Setter<Board2DSettings>;
}

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [boardType, setBoardType] = useLocalStorage<BoardType>(
    'boardType',
    '2d',
  );
  const [board2dSettings, setBoard2dSettings] =
    useLocalStorage<Board2DSettings>('board2dSettings', {
      colorTheme: 'classic',
      axisLabels: true,
      axisLabelSize: 12,
    });

  const themeParams = useMemo(() => {
    return themes[board2dSettings?.colorTheme ?? 'classic'];
  }, [board2dSettings?.colorTheme]);

  const settingsMemo = useMemo<SettingsState>(() => {
    return {
      boardType: boardType ?? '2d',
      board2dSettings: {
        colorTheme: 'classic',
        axisLabels: true,
        axisLabelSize: 12,
        ...board2dSettings,
      },
      themeParams,
      setBoardType,
      setBoard2dSettings,
    };
  }, [
    boardType,
    board2dSettings,
    themeParams,
    setBoardType,
    setBoard2dSettings,
  ]);

  return <SettingsContext value={settingsMemo}>{children}</SettingsContext>;
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useSettings() {
  const context = use(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
