import { ReactNode } from 'react';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  // Stubbed for now as we use hardcoded French per instructions
  return <>{children}</>;
}
