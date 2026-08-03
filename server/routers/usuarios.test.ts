import { describe, it, expect } from 'vitest';
import { usuariosRouter } from './usuarios';

describe('Usuarios Router', () => {
  describe('procedures', () => {
    it('should have list procedure defined', () => {
      const procedures = Object.keys(usuariosRouter._def.procedures);
      expect(procedures).toContain('list');
    });

    it('should have create procedure defined', () => {
      const procedures = Object.keys(usuariosRouter._def.procedures);
      expect(procedures).toContain('create');
    });

    it('should have update procedure defined', () => {
      const procedures = Object.keys(usuariosRouter._def.procedures);
      expect(procedures).toContain('update');
    });

    it('should have delete procedure defined', () => {
      const procedures = Object.keys(usuariosRouter._def.procedures);
      expect(procedures).toContain('delete');
    });
  });

  describe('router structure', () => {
    it('should be a valid tRPC router', () => {
      expect(usuariosRouter._def).toBeDefined();
      expect(usuariosRouter._def.procedures).toBeDefined();
    });
  });
});
