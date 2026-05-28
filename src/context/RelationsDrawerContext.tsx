import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { RelationEntityType } from '../lib/relations';

interface RelationsDrawerState {
  isOpen: boolean;
  entityType: RelationEntityType | null;
  entityId: string | null;
}

interface RelationsDrawerContextType extends RelationsDrawerState {
  openRelations: (entityType: RelationEntityType, entityId: string) => void;
  closeRelations: () => void;
}

const RelationsDrawerContext = createContext<RelationsDrawerContextType | undefined>(undefined);

export function RelationsDrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RelationsDrawerState>({
    isOpen: false,
    entityType: null,
    entityId: null
  });

  const openRelations = useCallback((entityType: RelationEntityType, entityId: string) => {
    setState({ isOpen: true, entityType, entityId });
  }, []);

  const closeRelations = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    // Delay clearing entity to allow exit animation if needed later
    setTimeout(() => {
      setState({ isOpen: false, entityType: null, entityId: null });
    }, 300);
  }, []);

  return (
    <RelationsDrawerContext.Provider value={{ ...state, openRelations, closeRelations }}>
      {children}
    </RelationsDrawerContext.Provider>
  );
}

export function useRelationsDrawer() {
  const context = useContext(RelationsDrawerContext);
  if (context === undefined) {
    throw new Error('useRelationsDrawer must be used within a RelationsDrawerProvider');
  }
  return context;
}
