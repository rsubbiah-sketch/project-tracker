import { describe, it, expect } from 'vitest';
import { n, g, u, ST, PROGRAM_TYPES, PROGRAM_PHASES, PHASE_COLOR } from './tokens';

describe('Design tokens', () => {
  // ─── Color palettes ───
  describe('navy (n)', () => {
    it('has all shade keys', () => {
      expect(n[900]).toBeTruthy();
      expect(n[950]).toBeTruthy();
      expect(n[800]).toBeTruthy();
    });

    it('values are valid CSS colors', () => {
      for (const val of Object.values(n)) {
        expect(typeof val).toBe('string');
        expect(val.startsWith('#') || val.startsWith('rgb')).toBe(true);
      }
    });
  });

  describe('gold (g)', () => {
    it('has primary gold color', () => {
      expect(g[500]).toBeTruthy();
    });
  });

  describe('semantic (u)', () => {
    it('has ok, warning, error, info, purple', () => {
      expect(u.ok).toBeTruthy();
      expect(u.w).toBeTruthy();
      expect(u.err).toBeTruthy();
      expect(u.inf).toBeTruthy();
      expect(u.pur).toBeTruthy();
    });

    it('has dark variants', () => {
      expect(u.okD).toBeTruthy();
      expect(u.wD).toBeTruthy();
      expect(u.errD).toBeTruthy();
    });
  });

  // ─── Status styles ───
  describe('ST (status styles)', () => {
    it('covers all statuses', () => {
      const expectedStatuses = ['On Track', 'At Risk', 'Delayed', 'Completed', 'Planning', 'Not Started'];
      for (const status of expectedStatuses) {
        expect(ST[status], `Missing status style for: ${status}`).toBeDefined();
        expect(ST[status].c).toBeTruthy();
        expect(ST[status].bg).toBeTruthy();
      }
    });
  });

  // ─── Program types ───
  describe('PROGRAM_TYPES', () => {
    it('includes HW, SW, Customer, NPI', () => {
      expect(PROGRAM_TYPES).toContain('HW');
      expect(PROGRAM_TYPES).toContain('SW');
      expect(PROGRAM_TYPES).toContain('Customer');
      expect(PROGRAM_TYPES).toContain('NPI');
    });
  });

  // ─── Program phases ───
  describe('PROGRAM_PHASES', () => {
    it('includes all phase states', () => {
      expect(PROGRAM_PHASES).toContain('New');
      expect(PROGRAM_PHASES).toContain('Active');
      expect(PROGRAM_PHASES).toContain('Waiting');
      expect(PROGRAM_PHASES).toContain('Blocked');
      expect(PROGRAM_PHASES).toContain('Complete');
    });
  });

  describe('PHASE_COLOR', () => {
    it('has a color for each phase', () => {
      for (const phase of PROGRAM_PHASES) {
        expect(PHASE_COLOR[phase], `Missing color for phase: ${phase}`).toBeTruthy();
        expect(PHASE_COLOR[phase].startsWith('#')).toBe(true);
      }
    });
  });

});
