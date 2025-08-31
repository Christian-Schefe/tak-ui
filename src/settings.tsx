import { createContext, use, useMemo } from 'react';
import { useLocalStorage } from 'react-use';
import { themes, type ColorTheme, type ThemeParams } from './assets/2d-themes';

export type BoardType = '2d' | '3d' | 'ninja';

export interface Board2DSettings {
  colorTheme: ColorTheme;
  animationSpeed: number;
  axisLabels: boolean;
  axisLabelSize: number;
}
export interface BoardNinjaSettings {
  colorTheme: Ninja2DThemes;
  axisLabels: 'normal' | 'small' | 'none';
}
export type Ninja2DThemes =
  | 'aaron'
  | 'aer'
  | 'aether'
  | 'aqua'
  | 'atlas'
  | 'backlit'
  | 'bubbletron'
  | 'classic'
  | 'discord'
  | 'essence'
  | 'fresh'
  | 'ignis'
  | 'luna'
  | 'paper'
  | 'retro'
  | 'stealth'
  | 'terra'
  | 'zen';

export type Setter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;

interface Settable<T> {
  value: T;
  setValue: Setter<T>;
}

export interface SettingsState {
  boardType: BoardType;
  boardSettings: {
    board2d: Board2DSettings;
    boardNinja: BoardNinjaSettings;
  };
  themeParams: ThemeParams;
  setBoardType: Setter<BoardType>;
  setBoardSettings: {
    board2d: Setter<Board2DSettings>;
    boardNinja: Setter<BoardNinjaSettings>;
  };
  devMode: Settable<boolean>;
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
      animationSpeed: 150,
      axisLabels: true,
      axisLabelSize: 12,
    });

  const [boardNinjaSettings, setBoardNinjaSettings] =
    useLocalStorage<BoardNinjaSettings>('boardNinjaSettings', {
      colorTheme: 'classic',
      axisLabels: 'normal',
    });

  const [devMode, setDevMode] = useLocalStorage<boolean>('devMode', false);

  const themeParams = useMemo(() => {
    return themes[board2dSettings?.colorTheme ?? 'classic'];
  }, [board2dSettings?.colorTheme]);

  const settingsMemo = useMemo<SettingsState>(() => {
    return {
      boardType: boardType ?? '2d',
      boardSettings: {
        board2d: {
          colorTheme: 'classic',
          axisLabels: true,
          axisLabelSize: 12,
          animationSpeed: 150,
          ...board2dSettings,
        },
        boardNinja: {
          colorTheme: 'classic',
          axisLabels: 'normal',
          ...boardNinjaSettings,
        },
      },
      themeParams,
      setBoardType,
      setBoardSettings: {
        board2d: setBoard2dSettings,
        boardNinja: setBoardNinjaSettings,
      },
      devMode: {
        value: devMode ?? false,
        setValue: setDevMode,
      },
    };
  }, [
    boardType,
    boardNinjaSettings,
    board2dSettings,
    themeParams,
    devMode,
    setBoardType,
    setBoard2dSettings,
    setBoardNinjaSettings,
    setDevMode,
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
