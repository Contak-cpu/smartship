import { useContext } from 'react';
import { SupabaseAuthContext } from '../contexts/SupabaseAuthContext';

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);

  if (context === undefined) {
    throw new Error('useSupabaseAuth debe ser usado dentro de un SupabaseAuthProvider');
  }

  return context;
};

