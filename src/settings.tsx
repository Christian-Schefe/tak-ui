import { createContext, useContext } from 'react';
import { useLocalStorage } from 'react-use';

export type BoardType = '2d' | '3d';

export type SettingsState = {
  boardType: BoardType;
  setBoardType: (type: BoardType) => void;
};

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [boardType, setBoardType] = useLocalStorage<BoardType>(
    'boardType',
    '2d',
  );

  return (
    <SettingsContext.Provider
      value={{ boardType: boardType || '3d', setBoardType }}
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
