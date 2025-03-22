'use client';

import { createContext, useContext, useState } from 'react';

interface SelectionContextType<T> {
  selectedItem: T | null;
  setSelectedItem: (item: T | null) => void;
}

const SelectionContext = createContext<SelectionContextType<any> | undefined>(undefined);

export function SelectionProvider<T>({ children }: { children: React.ReactNode }) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  
  return (
    <SelectionContext.Provider value={{ selectedItem, setSelectedItem }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection<T>() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context as SelectionContextType<T>;
} 