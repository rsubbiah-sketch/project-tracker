import { describe, it, expect } from 'vitest';
import { healthColor, healthLabel, healthBg, HEALTH_WEIGHTS, DIM_META, calcHealth } from './health';
import type { Program, Task } from '../types';

describe('Health scoring utilities', () => {
  // ─── Display helpers ───
  describe('healthColor', () => {
    it('returns green for >= 90', () => {
      expect(healthColor(90)).toBe('#34D399');
      expect(healthColor(100)).toBe('#34D399');
    });

    it('returns yellow for 70-89', () => {
      expect(healthColor(70)).toBe('#FBBF24');
      expect(healthColor(89)).toBe('#FBBF24');
    });

    it('returns red for < 70', () => {
      expect(healthColor(0)).toBe('#F87171');
      expect(healthColor(69)).toBe('#F87171');
    });
  });

  describe('healthLabel', () => {
    it('returns On Track for >= 90', () => {
      expect(healthLabel(90)).toBe('On Track');
    });

    it('returns At Risk for 70-89', () => {
      expect(healthLabel(80)).toBe('At Risk');
    });

    it('returns Critical for < 70', () => {
      expect(healthLabel(30)).toBe('Critical');
    });
  });

  describe('healthBg', () => {
    it('returns green bg for >= 90', () => {
      expect(healthBg(95)).toContain('52,211,153');
    });

    it('returns yellow bg for 70-89', () => {
      expect(healthBg(80)).toContain('251,191,36');
    });

    it('returns red bg for < 70', () => {
      expect(healthBg(30)).toContain('248,113,113');
    });
  });

  // ─── Weights ───
  describe('HEALTH_WEIGHTS', () => {
    it('defines weights for HW, SW, Customer, NPI', () => {
      expect(Object.keys(HEALTH_WEIGHTS)).toEqual(['HW', 'SW', 'Customer', 'NPI']);
    });

    it('each weight set sums to 1.0', () => {
      for (const [type, weights] of Object.entries(HEALTH_WEIGHTS)) {
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
      }
    });

    it('each weight set has 5 dimensions', () => {
      for (const weights of Object.values(HEALTH_WEIGHTS)) {
        expect(Object.keys(weights)).toEqual(['schedule', 'milestones', 'tasks', 'budget', 'quality']);
      }
    });
  });

  // ─── DIM_META ───
  describe('DIM_META', () => {
    it('has labels and icons for all 5 dimensions', () => {
      const dims = ['schedule', 'milestones', 'tasks', 'budget', 'quality'];
      for (const dim of dims) {
        expect(DIM_META[dim]).toBeDefined();
        expect(DIM_META[dim].label).toBeTruthy();
        expect(DIM_META[dim].icon).toBeTruthy();
      }
    });
  });

  // ─── calcHealth ───
  describe('calcHealth', () => {
    const baseProgram: Program = {
      id: 'PRG-001',
      name: 'Test Program',
      type: 'HW',
      subType: 'PRD',
      currentPhase: 'Active',
      owner: { id: 'u1', name: 'Test', role: 'editor', av: 'T' },
      assignedBy: { id: 'u2', name: 'Admin', role: 'admin', av: 'A' },
      assignedDate: '2025-01-01',
      lastUpdate: '2026-03-15',
      deliveryAsk: '2027-01-01',
      deliveryCommit: '2027-01-01',
      desc: 'Test',
      progress: 50,
      team: 10,
      budget: '$10M',
      budgetUsed: 50,
      mode: 'active',
      spark: [10, 20, 30, 40, 50],
      milestones: [],
    };

    it('returns a valid HealthResult', () => {
      const result = calcHealth(baseProgram, []);
      expect(result).toHaveProperty('dims');
      expect(result).toHaveProperty('composite');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('color');
    });

    it('composite is between 0 and 100', () => {
      const result = calcHealth(baseProgram, []);
      expect(result.composite).toBeGreaterThanOrEqual(0);
      expect(result.composite).toBeLessThanOrEqual(100);
    });

    it('all dimensions are between 0 and 100', () => {
      const result = calcHealth(baseProgram, []);
      for (const [dim, value] of Object.entries(result.dims)) {
        expect(value, `${dim} should be 0-100`).toBeGreaterThanOrEqual(0);
        expect(value, `${dim} should be 0-100`).toBeLessThanOrEqual(100);
      }
    });

    it('label matches composite value', () => {
      const result = calcHealth(baseProgram, []);
      if (result.composite >= 90) expect(result.label).toBe('On Track');
      else if (result.composite >= 70) expect(result.label).toBe('At Risk');
      else expect(result.label).toBe('Critical');
    });

    it('technology score reflects product readiness', () => {
      const result = calcHealth(baseProgram, []);
      expect(result.dims.technology).toBeDefined();
    });

    it('generates alerts for low-scoring dimensions', () => {
      const behind = { ...baseProgram, progress: 5, budgetUsed: 90 };
      const result = calcHealth(behind, []);
      expect(result.alerts.length).toBeGreaterThan(0);
    });
  });
});
