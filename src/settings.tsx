import { createContext, use, useMemo } from 'react';
import { useLocalStorage } from 'react-use';
import { themes, type ColorTheme, type ThemeParams } from './assets/2d-themes';

export type BoardType = '2d' | '3d';

export interface SettingsState {
  boardType: BoardType;
  colorTheme: ColorTheme;
  themeParams: ThemeParams;
  setBoardType: (type: BoardType) => void;
  setColorTheme: (theme: ColorTheme) => void;
}

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [boardType, setBoardType] = useLocalStorage<BoardType>(
    'boardType',
    '2d',
  );
  const [colorTheme, setColorTheme] = useLocalStorage<ColorTheme>(
    'colorTheme',
    'classic',
  );

  const themeParams = useMemo(() => {
    return themes[colorTheme ?? 'classic'];
  }, [colorTheme]);

  const settingsMemo = useMemo<SettingsState>(() => {
    return {
      boardType: boardType ?? '2d',
      colorTheme: colorTheme ?? 'classic',
      themeParams,
      setBoardType,
      setColorTheme,
    };
  }, [boardType, colorTheme, themeParams, setBoardType, setColorTheme]);

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
