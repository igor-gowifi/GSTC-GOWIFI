/**
 * Filter Coordinator
 * Ensures all filters work together in harmony (AND logic)
 * Each filter is applied in sequence, narrowing down results
 */

import { isDateInDay, isDateInMonth, isDateInYear } from './filterHelper';
import { getWeekRange, isDateInWeekRange } from './weekHelper';
import { getDateFieldFromSortBy, type DateFieldType } from './filterHelper';

export interface FilterInput {
  searchTerm?: string;
  status?: string;
  projeto?: string;
  empresaParceira?: string;
  dia?: 'hoje' | 'ontem' | 'amanha' | '';
  semana?: 'esta-semana' | 'semana-passada' | 'semana-que-vem' | '1a-semana' | '2a-semana' | '3a-semana' | '4a-semana' | '';
  mes?: string;
  ano?: string;
  sortBy?: string;
  dataCriacaoStart?: string;
  dataCriacaoEnd?: string;
  dataAtividadeStart?: string;
  dataAtividadeEnd?: string;
  dataConclusaoStart?: string;
  dataConclusaoEnd?: string;
}

export interface Solicitacao {
  id: string;
  solic_nome?: string;
  solic_projeto?: string;
  solic_servico?: string;
  solic_status?: string;
  solic_contato_local?: string;
  solic_observacoes?: string;
  solic_freshdesk?: string;
  solic_data_criacao?: string;
  solic_data_atividade?: string;
  solic_data_conclusao?: string;
  solic_tecnico_id?: string;
  [key: string]: any;
}

/**
 * Apply all filters in a coordinated way
 * Filters are applied in order, each narrowing down the results
 */
export function applyCoordinatedFilters(
  data: Solicitacao[],
  input: FilterInput
): Solicitacao[] {
  let filtered = [...data];

  console.log(`[FilterCoordinator] Starting with ${filtered.length} solicitacoes`);

  // 1. Apply search term filter (text-based)
  if (input.searchTerm) {
    filtered = applySearchFilter(filtered, input.searchTerm);
    console.log(`[FilterCoordinator] After search: ${filtered.length} solicitacoes`);
  }

  // 2. Apply status filter
  if (input.status) {
    filtered = applyStatusFilter(filtered, input.status);
    console.log(`[FilterCoordinator] After status filter: ${filtered.length} solicitacoes`);
  }

  // 3. Apply projeto filter
  if (input.projeto) {
    filtered = applyProjetoFilter(filtered, input.projeto);
    console.log(`[FilterCoordinator] After projeto filter: ${filtered.length} solicitacoes`);
  }

  // 4. Apply date filters (day, week, month, year)
  // These all work together based on sortBy
  if (input.dia || input.semana || input.mes || input.ano) {
    filtered = applyDateFilters(filtered, input);
    console.log(`[FilterCoordinator] After date filters: ${filtered.length} solicitacoes`);
  }

  // 5. Apply date range filters (if provided)
  if (input.dataCriacaoStart || input.dataCriacaoEnd) {
    filtered = applyDateRangeFilter(filtered, 'solic_data_criacao', input.dataCriacaoStart, input.dataCriacaoEnd);
    console.log(`[FilterCoordinator] After creation date range: ${filtered.length} solicitacoes`);
  }

  if (input.dataAtividadeStart || input.dataAtividadeEnd) {
    filtered = applyDateRangeFilter(filtered, 'solic_data_atividade', input.dataAtividadeStart, input.dataAtividadeEnd);
    console.log(`[FilterCoordinator] After activity date range: ${filtered.length} solicitacoes`);
  }

  if (input.dataConclusaoStart || input.dataConclusaoEnd) {
    filtered = applyDateRangeFilter(filtered, 'solic_data_conclusao', input.dataConclusaoStart, input.dataConclusaoEnd);
    console.log(`[FilterCoordinator] After conclusion date range: ${filtered.length} solicitacoes`);
  }

  console.log(`[FilterCoordinator] Final result: ${filtered.length} solicitacoes`);
  return filtered;
}

/**
 * Apply search term filter
 */
function applySearchFilter(data: Solicitacao[], searchTerm: string): Solicitacao[] {
  const term = searchTerm.toLowerCase();
  return data.filter(sol => {
    const searchFields = [
      sol.solic_nome,
      sol.solic_projeto,
      sol.solic_servico,
      sol.solic_contato_local,
      sol.solic_observacoes,
      sol.solic_freshdesk
    ].map(f => (f || '').toString().toLowerCase());
    return searchFields.some(field => field.includes(term));
  });
}

/**
 * Apply status filter
 */
function applyStatusFilter(data: Solicitacao[], status: string): Solicitacao[] {
  return data.filter(sol => {
    const solStatus = (sol.solic_status || '').toLowerCase();
    return solStatus.includes(status.toLowerCase());
  });
}

/**
 * Apply projeto filter
 */
function applyProjetoFilter(data: Solicitacao[], projeto: string): Solicitacao[] {
  return data.filter(sol => {
    const solProjeto = (sol.solic_projeto || '').toLowerCase();
    return solProjeto.includes(projeto.toLowerCase());
  });
}

/**
 * Apply date filters (day, week, month, year)
 * All work together based on sortBy
 */
function applyDateFilters(data: Solicitacao[], input: FilterInput): Solicitacao[] {
  const dateField = getDateFieldFromSortBy(input.sortBy || undefined);

  return data.filter(sol => {
    const dateValue = sol[dateField as keyof typeof sol];
    if (!dateValue) return false;

    const date = new Date(dateValue as string);

    // If day filter is set, check it
    if (input.dia) {
      if (!isDateInDay(date, input.dia as 'hoje' | 'ontem' | 'amanha')) {
        return false;
      }
    }

    // If week filter is set, check it
    if (input.semana) {
      const weekType = input.semana as 'esta-semana' | 'semana-passada' | 'semana-que-vem' | '1a-semana' | '2a-semana' | '3a-semana' | '4a-semana';
      const month = input.mes && input.mes !== '' ? parseInt(input.mes) : undefined;
      const year = input.ano && input.ano !== '' ? parseInt(input.ano) : undefined;
      const weekRange = getWeekRange(weekType, month, year);
      
      if (!isDateInWeekRange(date, weekRange)) {
        return false;
      }
    }

    // If month filter is set, check it
    if (input.mes) {
      const month = parseInt(input.mes);
      const year = input.ano ? parseInt(input.ano) : new Date().getFullYear();
      
      if (!isDateInMonth(date, month, year)) {
        return false;
      }
    }

    // If year filter is set (and no month), check it
    if (input.ano && !input.mes) {
      const year = parseInt(input.ano);
      
      if (!isDateInYear(date, year)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Apply date range filter
 */
function applyDateRangeFilter(
  data: Solicitacao[],
  dateField: string,
  startDate?: string,
  endDate?: string
): Solicitacao[] {
  if (!startDate && !endDate) {
    return data;
  }

  return data.filter(sol => {
    const dateValue = sol[dateField as keyof typeof sol];
    if (!dateValue) return false;

    const date = new Date(dateValue as string).getTime();
    const start = startDate ? new Date(startDate).getTime() : -Infinity;
    const end = endDate ? new Date(endDate).getTime() : Infinity;

    return date >= start && date <= end;
  });
}

/**
 * Get filter summary for logging/debugging
 */
export function getFilterSummary(input: FilterInput): string {
  const activeFilters = [];

  if (input.searchTerm) activeFilters.push(`search: "${input.searchTerm}"`);
  if (input.status) activeFilters.push(`status: ${input.status}`);
  if (input.projeto) activeFilters.push(`projeto: ${input.projeto}`);
  if (input.dia) activeFilters.push(`dia: ${input.dia}`);
  if (input.semana) activeFilters.push(`semana: ${input.semana}`);
  if (input.mes) activeFilters.push(`mes: ${input.mes}`);
  if (input.ano) activeFilters.push(`ano: ${input.ano}`);
  if (input.sortBy) activeFilters.push(`sortBy: ${input.sortBy}`);

  return activeFilters.length > 0 ? activeFilters.join(' + ') : 'no filters';
}
