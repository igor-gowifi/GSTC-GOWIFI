import { describe, it, expect } from 'vitest';
import {
  getDateFieldFromSortBy,
  getDateFieldDisplayName,
  isDateInDay,
  isDateInMonth,
  isDateInYear,
} from './filterHelper';

describe('Filter Helper Functions', () => {
  describe('getDateFieldFromSortBy', () => {
    it('should return solic_data_criacao for data-criacao sorts', () => {
      expect(getDateFieldFromSortBy('data-criacao-desc')).toBe('solic_data_criacao');
      expect(getDateFieldFromSortBy('data-criacao-asc')).toBe('solic_data_criacao');
    });

    it('should return solic_data_atividade for data-atividade sorts', () => {
      expect(getDateFieldFromSortBy('data-atividade-desc')).toBe('solic_data_atividade');
      expect(getDateFieldFromSortBy('data-atividade-asc')).toBe('solic_data_atividade');
    });

    it('should return solic_data_conclusao for data-conclusao sorts', () => {
      expect(getDateFieldFromSortBy('data-conclusao-desc')).toBe('solic_data_conclusao');
      expect(getDateFieldFromSortBy('data-conclusao-asc')).toBe('solic_data_conclusao');
    });

    it('should return solic_data_criacao for status sorts', () => {
      expect(getDateFieldFromSortBy('status-asc')).toBe('solic_data_criacao');
      expect(getDateFieldFromSortBy('status-desc')).toBe('solic_data_criacao');
    });

    it('should return solic_data_criacao when sortBy is undefined', () => {
      expect(getDateFieldFromSortBy()).toBe('solic_data_criacao');
      expect(getDateFieldFromSortBy('')).toBe('solic_data_criacao');
    });
  });

  describe('getDateFieldDisplayName', () => {
    it('should return correct display names', () => {
      expect(getDateFieldDisplayName('solic_data_criacao')).toBe('Data de Criação');
      expect(getDateFieldDisplayName('solic_data_atividade')).toBe('Data de Atividade');
      expect(getDateFieldDisplayName('solic_data_conclusao')).toBe('Data de Conclusão');
    });
  });

  describe('isDateInDay', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isDateInDay(today, 'hoje')).toBe(true);
    });

    it('should return false for other days when checking hoje', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isDateInDay(tomorrow, 'hoje')).toBe(false);
    });

    it('should return true for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isDateInDay(yesterday, 'ontem')).toBe(true);
    });

    it('should return true for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isDateInDay(tomorrow, 'amanha')).toBe(true);
    });

    it('should handle time differences correctly', () => {
      const today = new Date();
      today.setHours(14, 30, 45); // Different time same day
      expect(isDateInDay(today, 'hoje')).toBe(true);
    });
  });

  describe('isDateInMonth', () => {
    it('should return true for dates in the same month and year', () => {
      const date = new Date(2026, 0, 15); // January 15, 2026
      expect(isDateInMonth(date, 1, 2026)).toBe(true);
    });

    it('should return false for dates in different month', () => {
      const date = new Date(2026, 0, 15); // January 15, 2026
      expect(isDateInMonth(date, 2, 2026)).toBe(false);
    });

    it('should return false for dates in different year', () => {
      const date = new Date(2026, 0, 15); // January 15, 2026
      expect(isDateInMonth(date, 1, 2025)).toBe(false);
    });

    it('should work for all months', () => {
      for (let month = 1; month <= 12; month++) {
        const date = new Date(2026, month - 1, 15);
        expect(isDateInMonth(date, month, 2026)).toBe(true);
      }
    });
  });

  describe('isDateInYear', () => {
    it('should return true for dates in the same year', () => {
      const date = new Date(2026, 5, 15); // June 15, 2026
      expect(isDateInYear(date, 2026)).toBe(true);
    });

    it('should return false for dates in different year', () => {
      const date = new Date(2026, 5, 15); // June 15, 2026
      expect(isDateInYear(date, 2025)).toBe(false);
    });

    it('should work for all months in the same year', () => {
      for (let month = 0; month < 12; month++) {
        const date = new Date(2026, month, 15);
        expect(isDateInYear(date, 2026)).toBe(true);
      }
    });
  });
});
