import { describe, it, expect } from 'vitest';
import { tecnicosRouter } from './tecnicos';

describe('Tecnicos Router', () => {
  describe('main procedures', () => {
    it('should have list procedure defined', () => {
      const procedures = Object.keys(tecnicosRouter._def.procedures);
      expect(procedures).toContain('list');
    });

    it('should have update procedure defined', () => {
      const procedures = Object.keys(tecnicosRouter._def.procedures);
      expect(procedures).toContain('update');
    });

    it('should have delete procedure defined', () => {
      const procedures = Object.keys(tecnicosRouter._def.procedures);
      expect(procedures).toContain('delete');
    });

  });

  describe('router structure', () => {
    it('should be a valid tRPC router', () => {
      expect(tecnicosRouter._def).toBeDefined();
      expect(tecnicosRouter._def.procedures).toBeDefined();
    });
  });
});
