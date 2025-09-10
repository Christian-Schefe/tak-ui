import { createContext, use } from 'react';
import type { SettingsState } from './settings';

export function useSettings() {
  const context = use(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export const SettingsContext = createContext<SettingsState | undefined>(
  undefined,
);
