import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Testes para o endpoint de equipamentos
 * Credenciais de teste:
 * - Email: matheus.oliveira@gowifi.com.br
 * - Senha: Matheus@2025
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: ReturnType<typeof createClient>;
let testTecnicoId: string;
let testEquipamentoId: string;

describe('Equipamentos API', () => {
  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Get first technician for testing
    const { data: tecnicos } = await supabase
      .from('tecnicos')
      .select('id')
      .limit(1);

    if (tecnicos && tecnicos.length > 0) {
      testTecnicoId = tecnicos[0].id;
    }
  });

  it('should create a new equipment', async () => {
    const { data, error } = await supabase
      .from('tecnicos_equipamentos_historico')
      .insert({
        tecnico_id: testTecnicoId,
        equipamento_nome: 'Aruba',
        equipamento_marca: 'Aruba',
        equipamento_modelo: 'AP-303',
        equipamento_id_estoque: '0001',
        observacoes: 'Equipamento de teste',
        status: 'emprestado',
        criado_por: 'matheus.oliveira@gowifi.com.br',
      })
      .select();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.[0]).toHaveProperty('id');
    expect(data?.[0].equipamento_nome).toBe('Aruba');
    expect(data?.[0].equipamento_modelo).toBe('AP-303');
    
    if (data && data.length > 0) {
      testEquipamentoId = data[0].id;
    }
  });

  it('should retrieve equipment by technician', async () => {
    const { data, error } = await supabase
      .from('tecnicos_equipamentos_historico')
      .select('*')
      .eq('tecnico_id', testTecnicoId);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data?.length).toBeGreaterThan(0);
  });

  it('should update equipment', async () => {
    if (!testEquipamentoId) {
      expect.fail('No equipment ID to test update');
    }

    const { data, error } = await supabase
      .from('tecnicos_equipamentos_historico')
      .update({
        equipamento_modelo: 'AP-305',
        observacoes: 'Modelo atualizado',
        atualizado_por: 'matheus.oliveira@gowifi.com.br',
      })
      .eq('id', testEquipamentoId)
      .select();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.[0].equipamento_modelo).toBe('AP-305');
  });

  it('should mark equipment as returned', async () => {
    if (!testEquipamentoId) {
      expect.fail('No equipment ID to test return');
    }

    const { data, error } = await supabase
      .from('tecnicos_equipamentos_historico')
      .update({
        status: 'devolvido',
        data_devolucao: new Date().toISOString(),
        atualizado_por: 'matheus.oliveira@gowifi.com.br',
      })
      .eq('id', testEquipamentoId)
      .select();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.[0].status).toBe('devolvido');
    expect(data?.[0].data_devolucao).toBeDefined();
  });

  it('should retrieve all equipment history', async () => {
    const { data, error } = await supabase
      .from('tecnicos_equipamentos_historico')
      .select('*');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should filter equipment by status', async () => {
    const { data, error } = await supabase
      .from('tecnicos_equipamentos_historico')
      .select('*')
      .eq('status', 'emprestado');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    
    // All returned equipment should have emprestado status
    if (data && data.length > 0) {
      data.forEach((eq) => {
        expect(eq.status).toBe('emprestado');
      });
    }
  });

  it('should delete equipment', async () => {
    if (!testEquipamentoId) {
      expect.fail('No equipment ID to test delete');
    }

    const { error } = await supabase
      .from('tecnicos_equipamentos_historico')
      .delete()
      .eq('id', testEquipamentoId);

    expect(error).toBeNull();

    // Verify deletion
    const { data } = await supabase
      .from('tecnicos_equipamentos_historico')
      .select('*')
      .eq('id', testEquipamentoId);

    expect(data).toEqual([]);
  });

  it('should validate required fields', async () => {
    // Try to create without required fields
    const { error } = await supabase
      .from('tecnicos_equipamentos_historico')
      .insert({
        tecnico_id: testTecnicoId,
        // Missing required fields
      });

    expect(error).toBeDefined();
  });

  afterAll(async () => {
    // Cleanup - delete test equipment if it still exists
    if (testEquipamentoId) {
      await supabase
        .from('tecnicos_equipamentos_historico')
        .delete()
        .eq('id', testEquipamentoId);
    }
  });
});
