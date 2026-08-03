import { useState, useCallback } from 'react';

export interface FilterState {
  searchTerm: string;
  status: string;
  projeto: string;
  dia: 'hoje' | 'ontem' | 'amanha' | '';
  semana: 'esta-semana' | 'semana-passada' | '';
  mes: string;
  ano: string;
  empresaParceira: string;
  dataAtividade: string;
  dataCriacao: string;
  dataConclusao: string;
  dataCriacaoStart: string;
  dataCriacaoEnd: string;
  dataAtividadeStart: string;
  dataAtividadeEnd: string;
  dataConclusaoStart: string;
  dataConclusaoEnd: string;
}

const initialFilterState: FilterState = {
  searchTerm: '',
  status: '',
  projeto: '',
  dia: '',
  semana: '',
  mes: '',
  ano: '',
  empresaParceira: '',
  dataAtividade: '',
  dataCriacao: '',
  dataConclusao: '',
  dataCriacaoStart: '',
  dataCriacaoEnd: '',
  dataAtividadeStart: '',
  dataAtividadeEnd: '',
  dataConclusaoStart: '',
  dataConclusaoEnd: '',
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  const getActiveFilterCount = useCallback(() => {
    return Object.values(filters).filter(value => value !== '').length;
  }, [filters]);

  const getActiveFilters = useCallback(() => {
    const active: string[] = [];
    if (filters.searchTerm) active.push('Busca');
    if (filters.status) active.push('Status');
    if (filters.projeto) active.push('Projeto');
    if (filters.dia) active.push('Dia');
    if (filters.semana) active.push('Semana');
    if (filters.mes) active.push('Mês');
    if (filters.ano) active.push('Ano');
    if (filters.empresaParceira) active.push('Empresa');
    if (filters.dataAtividade) active.push('Data Atividade');
    if (filters.dataCriacao) active.push('Data Criação');
    if (filters.dataConclusao) active.push('Data Conclusão');
    if (filters.dataCriacaoStart || filters.dataCriacaoEnd) active.push('Data Criação (Range)');
    if (filters.dataAtividadeStart || filters.dataAtividadeEnd) active.push('Data Atividade (Range)');
    if (filters.dataConclusaoStart || filters.dataConclusaoEnd) active.push('Data Conclusão (Range)');
    return active;
  }, [filters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    getActiveFilterCount,
    getActiveFilters,
  };
}
