import { describe, it, expect, beforeEach, vi } from 'vitest';
import { solicitacoesRouter } from './solicitacoes';
import { protectedProcedure } from '../_core/trpc';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

describe('Solicitacoes Router', () => {
  describe('list procedure', () => {
    it('should have list procedure defined', () => {
      expect(solicitacoesRouter.createCaller).toBeDefined();
    });
  });

  describe('create procedure', () => {
    it('should have create procedure defined', () => {
      const procedures = Object.keys(solicitacoesRouter._def.procedures);
      expect(procedures).toContain('create');
    });
  });

  describe('update procedure', () => {
    it('should have update procedure defined', () => {
      const procedures = Object.keys(solicitacoesRouter._def.procedures);
      expect(procedures).toContain('update');
    });
  });

  describe('delete procedure', () => {
    it('should have delete procedure defined', () => {
      const procedures = Object.keys(solicitacoesRouter._def.procedures);
      expect(procedures).toContain('delete');
    });
  });

  describe('findNearestTecnicos procedure', () => {
    it('should have findNearestTecnicos procedure defined', () => {
      const procedures = Object.keys(solicitacoesRouter._def.procedures);
      expect(procedures).toContain('findNearestTecnicos');
    });
  });

  describe('sendToFreshdesk procedure', () => {
    it('should have sendToFreshdesk procedure defined', () => {
      const procedures = Object.keys(solicitacoesRouter._def.procedures);
      expect(procedures).toContain('sendToFreshdesk');
    });
  });
});
