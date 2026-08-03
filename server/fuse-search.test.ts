import { describe, it, expect } from 'vitest';
import Fuse from 'fuse.js';

describe('Fuse.js Fuzzy Search', () => {
  const mockSolicitacoes = [
    {
      id: 1,
      solic_nome: 'Instalação WiFi Residencial',
      solic_projeto: 'Projeto A',
      solic_servico: 'Instalação',
      solic_freshdesk: 'FRESH001',
      solic_contato_local: 'João Silva',
      solic_status: 'Pendente',
    },
    {
      id: 2,
      solic_nome: 'Manutenção Equipamento',
      solic_projeto: 'Projeto B',
      solic_servico: 'Manutenção',
      solic_freshdesk: 'FRESH002',
      solic_contato_local: 'Maria Santos',
      solic_status: 'Agendado',
    },
    {
      id: 3,
      solic_nome: 'Reparo de Conexão',
      solic_projeto: 'Projeto A',
      solic_servico: 'Reparo',
      solic_freshdesk: 'FRESH003',
      solic_contato_local: 'Pedro Costa',
      solic_status: 'Concluído',
    },
  ];

  it('should find exact matches in solic_nome', () => {
    const fuse = new Fuse(mockSolicitacoes, {
      keys: [
        { name: 'solic_nome', weight: 0.4 },
        { name: 'solic_projeto', weight: 0.3 },
        { name: 'solic_servico', weight: 0.2 },
        { name: 'solic_freshdesk', weight: 0.2 },
        { name: 'solic_contato_local', weight: 0.1 },
      ],
      threshold: 0.3,
      minMatchCharLength: 2,
    });

    const results = fuse.search('Instalação').map((r) => r.item);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].solic_nome).toContain('Instalação');
  });

  it('should find fuzzy matches with typos', () => {
    const fuse = new Fuse(mockSolicitacoes, {
      keys: [
        { name: 'solic_nome', weight: 0.4 },
        { name: 'solic_projeto', weight: 0.3 },
        { name: 'solic_servico', weight: 0.2 },
        { name: 'solic_freshdesk', weight: 0.2 },
        { name: 'solic_contato_local', weight: 0.1 },
      ],
      threshold: 0.3,
      minMatchCharLength: 2,
    });

    // Search with typo "Manutencao" instead of "Manutenção"
    const results = fuse.search('Manutencao').map((r) => r.item);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].solic_servico).toBe('Manutenção');
  });

  it('should search across multiple fields with weighted results', () => {
    const fuse = new Fuse(mockSolicitacoes, {
      keys: [
        { name: 'solic_nome', weight: 0.4 },
        { name: 'solic_projeto', weight: 0.3 },
        { name: 'solic_servico', weight: 0.2 },
        { name: 'solic_freshdesk', weight: 0.2 },
        { name: 'solic_contato_local', weight: 0.1 },
      ],
      threshold: 0.3,
      minMatchCharLength: 2,
    });

    const results = fuse.search('Projeto A').map((r) => r.item);
    expect(results.length).toBeGreaterThan(0);
    // Should find items with "Projeto A"
    expect(results.some((r) => r.solic_projeto === 'Projeto A')).toBe(true);
  });

  it('should find partial matches in solic_contato_local', () => {
    const fuse = new Fuse(mockSolicitacoes, {
      keys: [
        { name: 'solic_nome', weight: 0.4 },
        { name: 'solic_projeto', weight: 0.3 },
        { name: 'solic_servico', weight: 0.2 },
        { name: 'solic_freshdesk', weight: 0.2 },
        { name: 'solic_contato_local', weight: 0.1 },
      ],
      threshold: 0.3,
      minMatchCharLength: 2,
    });

    const results = fuse.search('João').map((r) => r.item);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].solic_contato_local).toContain('João');
  });

  it('should return empty array for non-matching search', () => {
    const fuse = new Fuse(mockSolicitacoes, {
      keys: [
        { name: 'solic_nome', weight: 0.4 },
        { name: 'solic_projeto', weight: 0.3 },
        { name: 'solic_servico', weight: 0.2 },
        { name: 'solic_freshdesk', weight: 0.2 },
        { name: 'solic_contato_local', weight: 0.1 },
      ],
      threshold: 0.3,
      minMatchCharLength: 2,
    });

    const results = fuse.search('XYZ123NonExistent').map((r) => r.item);
    expect(results.length).toBe(0);
  });

  it('should respect minMatchCharLength setting', () => {
    const fuse = new Fuse(mockSolicitacoes, {
      keys: [
        { name: 'solic_nome', weight: 0.4 },
        { name: 'solic_projeto', weight: 0.3 },
        { name: 'solic_servico', weight: 0.2 },
        { name: 'solic_freshdesk', weight: 0.2 },
        { name: 'solic_contato_local', weight: 0.1 },
      ],
      threshold: 0.3,
      minMatchCharLength: 2,
    });

    // Single character should not match
    const results = fuse.search('A').map((r) => r.item);
    // With minMatchCharLength: 2, single character searches should be ignored
    expect(results.length).toBe(0);
  });

  it('should handle empty search term gracefully', () => {
    const fuse = new Fuse(mockSolicitacoes, {
      keys: [
        { name: 'solic_nome', weight: 0.4 },
        { name: 'solic_projeto', weight: 0.3 },
        { name: 'solic_servico', weight: 0.2 },
        { name: 'solic_freshdesk', weight: 0.2 },
        { name: 'solic_contato_local', weight: 0.1 },
      ],
      threshold: 0.3,
      minMatchCharLength: 2,
    });

    const results = fuse.search('').map((r) => r.item);
    // Empty search should return no results
    expect(results.length).toBe(0);
  });

  it('should prioritize higher-weighted fields in results', () => {
    const fuse = new Fuse(mockSolicitacoes, {
      keys: [
        { name: 'solic_nome', weight: 0.4 }, // Highest weight
        { name: 'solic_projeto', weight: 0.3 },
        { name: 'solic_servico', weight: 0.2 },
        { name: 'solic_freshdesk', weight: 0.2 },
        { name: 'solic_contato_local', weight: 0.1 }, // Lowest weight
      ],
      threshold: 0.3,
      minMatchCharLength: 2,
    });

    // Search for "Reparo" which appears in solic_servico
    const results = fuse.search('Reparo').map((r) => r.item);
    expect(results.length).toBeGreaterThan(0);
    // Should find the item with "Reparo" in solic_servico
    expect(results[0].solic_servico).toBe('Reparo');
  });
});
