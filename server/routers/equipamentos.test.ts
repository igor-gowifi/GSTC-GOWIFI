import { describe, it, expect } from 'vitest';
import { equipamentosRouter } from './equipamentos';

describe('Equipamentos Router', () => {
  describe('procedures', () => {
    it('should have create procedure defined', () => {
      const procedures = Object.keys(equipamentosRouter._def.procedures);
      expect(procedures).toContain('create');
    });

    it('should have update procedure defined', () => {
      const procedures = Object.keys(equipamentosRouter._def.procedures);
      expect(procedures).toContain('update');
    });

    it('should have delete procedure defined', () => {
      const procedures = Object.keys(equipamentosRouter._def.procedures);
      expect(procedures).toContain('delete');
    });

    it('should have markAsReturned procedure defined', () => {
      const procedures = Object.keys(equipamentosRouter._def.procedures);
      expect(procedures).toContain('markAsReturned');
    });

    it('should have historico procedure defined', () => {
      const procedures = Object.keys(equipamentosRouter._def.procedures);
      expect(procedures).toContain('historico');
    });

    it('should have historicoByTecnico procedure defined', () => {
      const procedures = Object.keys(equipamentosRouter._def.procedures);
      expect(procedures).toContain('historicoByTecnico');
    });

    it('should have historicoByStatus procedure defined', () => {
      const procedures = Object.keys(equipamentosRouter._def.procedures);
      expect(procedures).toContain('historicoByStatus');
    });
  });

  describe('router structure', () => {
    it('should be a valid tRPC router', () => {
      expect(equipamentosRouter._def).toBeDefined();
      expect(equipamentosRouter._def.procedures).toBeDefined();
    });

    it('should have all required procedures', () => {
      const procedures = Object.keys(equipamentosRouter._def.procedures);
      const requiredProcedures = [
        'create',
        'update',
        'delete',
        'markAsReturned',
        'historico',
        'historicoByTecnico',
        'historicoByStatus',
      ];
      requiredProcedures.forEach((proc) => {
        expect(procedures).toContain(proc);
      });
    });
  });
});
