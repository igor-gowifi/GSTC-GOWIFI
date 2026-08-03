import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Solicitacoes Filtering and Pagination', () => {
  // Mock data for testing
  const mockSolicitacoes = [
    {
      id: '1',
      solic_nome: 'Solicitacao 1',
      solic_data_criacao: '2026-01-20',
      solic_data_atividade: '2026-01-21',
      solic_data_conclusao: '2026-01-22',
      solic_status: 'concluidas',
      solic_projeto: 'WiFi Seguro',
      solic_empresa_parceira: 'iNFRATELE',
    },
    {
      id: '2',
      solic_nome: 'Solicitacao 2',
      solic_data_criacao: '2026-01-19',
      solic_data_atividade: '2026-01-20',
      solic_data_conclusao: '2026-01-21',
      solic_status: 'pendentes',
      solic_projeto: 'Bradesco',
      solic_empresa_parceira: 'LUCIANO TEAM',
    },
    {
      id: '3',
      solic_nome: 'Solicitacao 3',
      solic_data_criacao: '2026-01-18',
      solic_data_atividade: '2026-01-19',
      solic_data_conclusao: '2026-01-20',
      solic_status: 'atribuidas',
      solic_projeto: 'Santander',
      solic_empresa_parceira: 'FINDUP',
    },
  ];

  describe('Status Filter', () => {
    it('should filter solicitacoes by status', () => {
      const filtered = mockSolicitacoes.filter(
        (s) => s.solic_status === 'concluidas'
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should return all solicitacoes when no status filter is applied', () => {
      const filtered = mockSolicitacoes.filter(() => true);
      expect(filtered).toHaveLength(3);
    });

    it('should return empty array when filtering by non-existent status', () => {
      const filtered = mockSolicitacoes.filter(
        (s) => s.solic_status === 'improdutivas'
      );
      expect(filtered).toHaveLength(0);
    });
  });

  describe('Pagination (25 items per page)', () => {
    const ITEMS_PER_PAGE = 25;

    it('should correctly paginate 50 items into 2 pages', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        ...mockSolicitacoes[0],
        id: String(i),
      }));

      const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
      expect(totalPages).toBe(2);

      // Page 1
      const page1 = items.slice(0, ITEMS_PER_PAGE);
      expect(page1).toHaveLength(25);

      // Page 2
      const page2 = items.slice(ITEMS_PER_PAGE, ITEMS_PER_PAGE * 2);
      expect(page2).toHaveLength(25);
    });

    it('should correctly paginate 30 items into 2 pages', () => {
      const items = Array.from({ length: 30 }, (_, i) => ({
        ...mockSolicitacoes[0],
        id: String(i),
      }));

      const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
      expect(totalPages).toBe(2);

      // Page 1
      const page1 = items.slice(0, ITEMS_PER_PAGE);
      expect(page1).toHaveLength(25);

      // Page 2
      const page2 = items.slice(ITEMS_PER_PAGE, ITEMS_PER_PAGE * 2);
      expect(page2).toHaveLength(5);
    });

    it('should correctly paginate less than 25 items into 1 page', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        ...mockSolicitacoes[0],
        id: String(i),
      }));

      const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
      expect(totalPages).toBe(1);

      const page1 = items.slice(0, ITEMS_PER_PAGE);
      expect(page1).toHaveLength(10);
    });

    it('should correctly calculate page range display', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        ...mockSolicitacoes[0],
        id: String(i),
      }));

      const currentPage = 2;
      const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, items.length);

      const start = startIdx + 1;
      const end = endIdx;
      const total = items.length;

      expect(start).toBe(26);
      expect(end).toBe(50);
      expect(total).toBe(50);
    });
  });

  describe('Sorting', () => {
    it('should sort by data criacao descending (most recent first)', () => {
      const sorted = [...mockSolicitacoes].sort(
        (a, b) =>
          new Date(b.solic_data_criacao).getTime() -
          new Date(a.solic_data_criacao).getTime()
      );

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('should sort by data criacao ascending (oldest first)', () => {
      const sorted = [...mockSolicitacoes].sort(
        (a, b) =>
          new Date(a.solic_data_criacao).getTime() -
          new Date(b.solic_data_criacao).getTime()
      );

      expect(sorted[0].id).toBe('3');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('1');
    });

    it('should sort by status alphabetically ascending', () => {
      const sorted = [...mockSolicitacoes].sort((a, b) =>
        a.solic_status.localeCompare(b.solic_status)
      );

      expect(sorted[0].solic_status).toBe('atribuidas');
      expect(sorted[1].solic_status).toBe('concluidas');
      expect(sorted[2].solic_status).toBe('pendentes');
    });

    it('should sort by status alphabetically descending', () => {
      const sorted = [...mockSolicitacoes].sort((a, b) =>
        b.solic_status.localeCompare(a.solic_status)
      );

      expect(sorted[0].solic_status).toBe('pendentes');
      expect(sorted[1].solic_status).toBe('concluidas');
      expect(sorted[2].solic_status).toBe('atribuidas');
    });
  });

  describe('Combined Filtering and Pagination', () => {
    it('should filter and then paginate correctly', () => {
      const ITEMS_PER_PAGE = 25;
      const filtered = mockSolicitacoes.filter(
        (s) => s.solic_status === 'concluidas'
      );

      const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
      expect(totalPages).toBe(1);

      const page1 = filtered.slice(0, ITEMS_PER_PAGE);
      expect(page1).toHaveLength(1);
      expect(page1[0].id).toBe('1');
    });

    it('should filter, sort, and then paginate correctly', () => {
      const ITEMS_PER_PAGE = 25;
      const filtered = mockSolicitacoes.filter(
        (s) => s.solic_status !== 'improdutivas'
      );

      const sorted = [...filtered].sort(
        (a, b) =>
          new Date(b.solic_data_criacao).getTime() -
          new Date(a.solic_data_criacao).getTime()
      );

      const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
      expect(totalPages).toBe(1);

      const page1 = sorted.slice(0, ITEMS_PER_PAGE);
      expect(page1).toHaveLength(3);
      expect(page1[0].id).toBe('1');
      expect(page1[1].id).toBe('2');
      expect(page1[2].id).toBe('3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      const items: typeof mockSolicitacoes = [];
      const totalPages = Math.ceil(items.length / 25);
      expect(totalPages).toBe(0);
    });

    it('should handle exactly 25 items', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({
        ...mockSolicitacoes[0],
        id: String(i),
      }));

      const totalPages = Math.ceil(items.length / 25);
      expect(totalPages).toBe(1);
    });

    it('should handle exactly 50 items', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        ...mockSolicitacoes[0],
        id: String(i),
      }));

      const totalPages = Math.ceil(items.length / 25);
      expect(totalPages).toBe(2);
    });

    it('should handle 1 item', () => {
      const items = [mockSolicitacoes[0]];
      const totalPages = Math.ceil(items.length / 25);
      expect(totalPages).toBe(1);
    });
  });
});
