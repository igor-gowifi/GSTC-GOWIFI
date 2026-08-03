import { createContext, useContext, useState, useEffect } from 'react';
import { Tecnico, Solicitacao } from '@/types';

interface DataContextType {
  tecnicos: Tecnico[];
  solicitacoes: Solicitacao[];
  loading: boolean;
  error: string | null;
  refreshTecnicos: () => void;
  refreshSolicitacoes: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Load tecnicos from Supabase API via tRPC
    console.log('ℹ️ DataContext initialized - loading from Supabase API');
    setLoading(false);
  }, []);

  const refreshTecnicos = () => {
    // TODO: Implement refresh from Supabase API
    console.log('Refreshing técnicos from Supabase API');
  };

  const refreshSolicitacoes = () => {
    // TODO: Implement refresh from Supabase API
    console.log('Refreshing solicitações from Supabase API');
  };

  return (
    <DataContext.Provider
      value={{
        tecnicos,
        solicitacoes,
        loading,
        error,
        refreshTecnicos,
        refreshSolicitacoes,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
