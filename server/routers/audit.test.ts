import { describe, it, expect } from 'vitest';
import { auditRouter } from './audit';

describe('Audit Router', () => {
  describe('procedures', () => {
    it('should have list procedure defined', () => {
      const procedures = Object.keys(auditRouter._def.procedures);
      expect(procedures).toContain('list');
    });

    it('should have log procedure defined', () => {
      const procedures = Object.keys(auditRouter._def.procedures);
      expect(procedures).toContain('log');
    });
  });

  describe('router structure', () => {
    it('should be a valid tRPC router', () => {
      expect(auditRouter._def).toBeDefined();
      expect(auditRouter._def.procedures).toBeDefined();
    });

    it('should have all required procedures', () => {
      const procedures = Object.keys(auditRouter._def.procedures);
      const requiredProcedures = ['list', 'log'];
      requiredProcedures.forEach((proc) => {
        expect(procedures).toContain(proc);
      });
    });
  });
});
