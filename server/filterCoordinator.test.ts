import { describe, it, expect, beforeEach } from 'vitest';
import { applyCoordinatedFilters, getFilterSummary, type FilterInput, type Solicitacao } from './filterCoordinator';

describe('Filter Coordinator', () => {
  let mockData: Solicitacao[];

  beforeEach(() => {
    // Create mock solicitacoes with various dates and statuses
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    mockData = [
      {
        id: '1',
        solic_nome: 'Solicitação 1',
        solic_status: 'Aberta',
        solic_projeto: 'Projeto A',
        solic_data_criacao: today.toISOString(),
        solic_data_atividade: today.toISOString(),
        solic_data_conclusao: null,
      },
      {
        id: '2',
        solic_nome: 'Solicitação 2',
        solic_status: 'Concluída',
        solic_projeto: 'Projeto B',
        solic_data_criacao: yesterday.toISOString(),
        solic_data_atividade: yesterday.toISOString(),
        solic_data_conclusao: yesterday.toISOString(),
      },
      {
        id: '3',
        solic_nome: 'Solicitação 3',
        solic_status: 'Aberta',
        solic_projeto: 'Projeto A',
        solic_data_criacao: tomorrow.toISOString(),
        solic_data_atividade: tomorrow.toISOString(),
        solic_data_conclusao: null,
      },
    ];
  });

  describe('Single Filters', () => {
    it('should filter by status', () => {
      const input: FilterInput = {
        status: 'Concluída',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter by projeto', () => {
      const input: FilterInput = {
        projeto: 'Projeto A',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toEqual(['1', '3']);
    });

    it('should filter by search term', () => {
      const input: FilterInput = {
        searchTerm: 'Solicitação 2',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter by day (hoje)', () => {
      const input: FilterInput = {
        dia: 'hoje',
        sortBy: 'data-criacao-desc',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('Combined Filters (AND Logic)', () => {
    it('should combine status + projeto filters', () => {
      const input: FilterInput = {
        status: 'Aberta',
        projeto: 'Projeto A',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toEqual(['1', '3']);
    });

    it('should combine status + projeto + day filters', () => {
      const input: FilterInput = {
        status: 'Aberta',
        projeto: 'Projeto A',
        dia: 'hoje',
        sortBy: 'data-criacao-desc',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should combine search + status filters', () => {
      const input: FilterInput = {
        searchTerm: 'Solicitação',
        status: 'Concluída',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should return empty when filters have no matches', () => {
      const input: FilterInput = {
        status: 'Concluída',
        projeto: 'Projeto A',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(0);
    });
  });

  describe('Filter Summary', () => {
    it('should generate correct summary for single filter', () => {
      const input: FilterInput = {
        status: 'Aberta',
      };

      const summary = getFilterSummary(input);
      expect(summary).toContain('status: Aberta');
    });

    it('should generate correct summary for multiple filters', () => {
      const input: FilterInput = {
        status: 'Aberta',
        projeto: 'Projeto A',
        searchTerm: 'test',
      };

      const summary = getFilterSummary(input);
      expect(summary).toContain('search: "test"');
      expect(summary).toContain('status: Aberta');
      expect(summary).toContain('projeto: Projeto A');
    });

    it('should return "no filters" when no filters are applied', () => {
      const input: FilterInput = {};

      const summary = getFilterSummary(input);
      expect(summary).toBe('no filters');
    });
  });

  describe('Date-based Filters with sortBy', () => {
    it('should filter by creation date when sortBy is data-criacao', () => {
      const input: FilterInput = {
        dia: 'hoje',
        sortBy: 'data-criacao-desc',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter by activity date when sortBy is data-atividade', () => {
      const input: FilterInput = {
        dia: 'ontem',
        sortBy: 'data-atividade-desc',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should use creation date when sortBy is not date-based', () => {
      const input: FilterInput = {
        dia: 'hoje',
        sortBy: 'status-asc',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search term', () => {
      const input: FilterInput = {
        searchTerm: '',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(3);
    });

    it('should handle null date values', () => {
      const input: FilterInput = {
        dia: 'hoje',
        sortBy: 'data-conclusao-desc',
      };

      const result = applyCoordinatedFilters(mockData, input);
      // Should return 0 since only item with conclusion date today is none
      expect(result).toHaveLength(0);
    });

    it('should handle case-insensitive status filter', () => {
      const input: FilterInput = {
        status: 'aberta',
      };

      const result = applyCoordinatedFilters(mockData, input);
      expect(result).toHaveLength(2);
    });
  });
});
