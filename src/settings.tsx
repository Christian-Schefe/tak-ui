import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from 'react-use';
import { themes, type ThemeParams } from './assets/2d-themes';

export type BoardType = '2d' | '3d';
export type ColorTheme = 'classic';

export type SettingsState = {
  boardType: BoardType;
  colorTheme: ColorTheme;
  themeParams: ThemeParams;
  setBoardType: (type: BoardType) => void;
  setColorTheme: (theme: ColorTheme) => void;
};

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

  return (
    <SettingsContext.Provider
      value={{
        boardType: boardType || '3d',
        setBoardType,
        themeParams,
        colorTheme: colorTheme || 'classic',
        setColorTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
