import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWeekNumberOfMonth,
  getWeekRangeOfMonth,
  getCurrentWeekRange,
  getPreviousWeekRange,
  getNextWeekRange,
  getWeekRange,
  isDateInWeekRange,
} from './weekHelper';

describe('Week Helper Functions', () => {
  describe('getWeekNumberOfMonth', () => {
    it('should return 1 for days 1-7', () => {
      expect(getWeekNumberOfMonth(new Date(2026, 0, 1))).toBe(1);
      expect(getWeekNumberOfMonth(new Date(2026, 0, 7))).toBe(1);
    });

    it('should return 2 for days 8-14', () => {
      expect(getWeekNumberOfMonth(new Date(2026, 0, 8))).toBe(2);
      expect(getWeekNumberOfMonth(new Date(2026, 0, 14))).toBe(2);
    });

    it('should return 3 for days 15-21', () => {
      expect(getWeekNumberOfMonth(new Date(2026, 0, 15))).toBe(3);
      expect(getWeekNumberOfMonth(new Date(2026, 0, 21))).toBe(3);
    });

    it('should return 4 for days 22-28', () => {
      expect(getWeekNumberOfMonth(new Date(2026, 0, 22))).toBe(4);
      expect(getWeekNumberOfMonth(new Date(2026, 0, 28))).toBe(4);
    });

    it('should return 5 for days 29+', () => {
      expect(getWeekNumberOfMonth(new Date(2026, 0, 29))).toBe(5); // January has 31 days
    });
  });

  describe('getWeekRangeOfMonth', () => {
    it('should return correct range for week 1', () => {
      const range = getWeekRangeOfMonth(1, 1, 2026);
      expect(range.startDate.getDate()).toBe(1);
      expect(range.endDate.getDate()).toBe(7);
    });

    it('should return correct range for week 2', () => {
      const range = getWeekRangeOfMonth(2, 1, 2026);
      expect(range.startDate.getDate()).toBe(8);
      expect(range.endDate.getDate()).toBe(14);
    });

    it('should return correct range for week 3', () => {
      const range = getWeekRangeOfMonth(3, 1, 2026);
      expect(range.startDate.getDate()).toBe(15);
      expect(range.endDate.getDate()).toBe(21);
    });

    it('should return correct range for week 4', () => {
      const range = getWeekRangeOfMonth(4, 1, 2026);
      expect(range.startDate.getDate()).toBe(22);
      expect(range.endDate.getDate()).toBe(28);
    });

    it('should not exceed last day of month', () => {
      const range = getWeekRangeOfMonth(4, 1, 2026); // January has 31 days
      expect(range.endDate.getDate()).toBeLessThanOrEqual(31);
    });
  });

  describe('getCurrentWeekRange', () => {
    it('should return a range with startDate on Monday and endDate on Sunday', () => {
      const range = getCurrentWeekRange();
      const startDay = range.startDate.getDay();
      const endDay = range.endDate.getDay();
      
      expect(startDay).toBe(1); // Monday
      expect(endDay).toBe(0); // Sunday
    });

    it('should span exactly 6 days (Monday to Sunday)', () => {
      const range = getCurrentWeekRange();
      const diffTime = Math.abs(range.endDate.getTime() - range.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      expect(diffDays).toBe(6);
    });
  });

  describe('getPreviousWeekRange', () => {
    it('should return a range 7 days before current week', () => {
      const current = getCurrentWeekRange();
      const previous = getPreviousWeekRange();
      
      const diffTime = current.startDate.getTime() - previous.startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      expect(diffDays).toBe(7);
    });

    it('should have Monday-Sunday structure', () => {
      const range = getPreviousWeekRange();
      expect(range.startDate.getDay()).toBe(1); // Monday
      expect(range.endDate.getDay()).toBe(0); // Sunday
    });
  });

  describe('getNextWeekRange', () => {
    it('should return a range 7 days after current week', () => {
      const current = getCurrentWeekRange();
      const next = getNextWeekRange();
      
      const diffTime = next.startDate.getTime() - current.endDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      expect(diffDays).toBe(1); // Should start the day after current week ends
    });

    it('should have Monday-Sunday structure', () => {
      const range = getNextWeekRange();
      expect(range.startDate.getDay()).toBe(1); // Monday
      expect(range.endDate.getDay()).toBe(0); // Sunday
    });
  });

  describe('getWeekRange', () => {
    it('should return current week for esta-semana', () => {
      const range = getWeekRange('esta-semana');
      const current = getCurrentWeekRange();
      
      expect(range.startDate.getDate()).toBe(current.startDate.getDate());
      expect(range.endDate.getDate()).toBe(current.endDate.getDate());
    });

    it('should return previous week for semana-passada', () => {
      const range = getWeekRange('semana-passada');
      const previous = getPreviousWeekRange();
      
      expect(range.startDate.getDate()).toBe(previous.startDate.getDate());
      expect(range.endDate.getDate()).toBe(previous.endDate.getDate());
    });

    it('should return next week for semana-que-vem', () => {
      const range = getWeekRange('semana-que-vem');
      const next = getNextWeekRange();
      
      expect(range.startDate.getDate()).toBe(next.startDate.getDate());
      expect(range.endDate.getDate()).toBe(next.endDate.getDate());
    });

    it('should return correct week for month-based weeks', () => {
      const range1 = getWeekRange('1a-semana', 1, 2026);
      expect(range1.startDate.getDate()).toBe(1);
      expect(range1.endDate.getDate()).toBe(7);

      const range2 = getWeekRange('2a-semana', 1, 2026);
      expect(range2.startDate.getDate()).toBe(8);
      expect(range2.endDate.getDate()).toBe(14);
    });
  });

  describe('isDateInWeekRange', () => {
    it('should return true for dates within range', () => {
      const range = getWeekRangeOfMonth(1, 1, 2026);
      const dateInRange = new Date(2026, 0, 5);
      
      expect(isDateInWeekRange(dateInRange, range)).toBe(true);
    });

    it('should return false for dates outside range', () => {
      const range = getWeekRangeOfMonth(1, 1, 2026);
      const dateOutside = new Date(2026, 0, 15);
      
      expect(isDateInWeekRange(dateOutside, range)).toBe(false);
    });

    it('should include boundary dates', () => {
      const range = getWeekRangeOfMonth(1, 1, 2026);
      const startDate = new Date(2026, 0, 1);
      const endDate = new Date(2026, 0, 7);
      
      expect(isDateInWeekRange(startDate, range)).toBe(true);
      expect(isDateInWeekRange(endDate, range)).toBe(true);
    });
  });
});
