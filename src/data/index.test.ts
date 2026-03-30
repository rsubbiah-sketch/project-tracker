import { describe, it, expect } from 'vitest';
import {
  USERS,
  ME,
  INITIAL_PROGRAMS,
  INITIAL_COMMENTS,
  INITIAL_REPLIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_TASKS,
  INITIAL_IMPL,
  INITIAL_DOCS,
} from './index';

describe('Sample data integrity', () => {
  // ─── USERS ───
  describe('USERS', () => {
    it('has at least 7 users', () => {
      expect(USERS.length).toBeGreaterThanOrEqual(7);
    });

    it('each user has required fields', () => {
      for (const u of USERS) {
        expect(u.id).toBeTruthy();
        expect(u.name).toBeTruthy();
        expect(u.role).toBeTruthy();
        expect(u.av).toBeTruthy();
      }
    });

    it('user IDs are unique', () => {
      const ids = USERS.map(u => u.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('ME is a valid user from USERS', () => {
      expect(USERS).toContain(ME);
      expect(ME.role).toBeTruthy();
    });
  });

  // ─── PROGRAMS ───
  describe('INITIAL_PROGRAMS', () => {
    it('has at least 6 programs', () => {
      expect(INITIAL_PROGRAMS.length).toBeGreaterThanOrEqual(6);
    });

    it('each program has required fields', () => {
      for (const p of INITIAL_PROGRAMS) {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.type).toBeTruthy();
        expect(p.owner).toBeTruthy();
        expect(p.owner.id).toBeTruthy();
        expect(typeof p.progress).toBe('number');
      }
    });

    it('program IDs are unique', () => {
      const ids = INITIAL_PROGRAMS.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('program types are valid', () => {
      const validTypes = ['HW', 'SW', 'Customer', 'NPI'];
      for (const p of INITIAL_PROGRAMS) {
        expect(validTypes).toContain(p.type);
      }
    });

    it('progress is 0-100', () => {
      for (const p of INITIAL_PROGRAMS) {
        expect(p.progress).toBeGreaterThanOrEqual(0);
        expect(p.progress).toBeLessThanOrEqual(100);
      }
    });
  });

  // ─── TASKS ───
  describe('INITIAL_TASKS', () => {
    it('has at least 12 tasks', () => {
      expect(INITIAL_TASKS.length).toBeGreaterThanOrEqual(12);
    });

    it('each task references a valid program', () => {
      const programIds = new Set(INITIAL_PROGRAMS.map(p => p.id));
      for (const t of INITIAL_TASKS) {
        expect(programIds.has(t.prgId), `Task ${t.id} references unknown program ${t.prgId}`).toBe(true);
      }
    });

    it('each task has required fields', () => {
      for (const t of INITIAL_TASKS) {
        expect(t.id).toBeTruthy();
        expect(t.title).toBeTruthy();
        expect(t.prgId).toBeTruthy();
        expect(t.priority).toBeTruthy();
        expect(t.status).toBeTruthy();
      }
    });
  });

  // ─── COMMENTS ───
  describe('INITIAL_COMMENTS', () => {
    it('has at least 7 comments', () => {
      expect(INITIAL_COMMENTS.length).toBeGreaterThanOrEqual(7);
    });

    it('each comment references a valid program', () => {
      const programIds = new Set(INITIAL_PROGRAMS.map(p => p.id));
      for (const c of INITIAL_COMMENTS) {
        expect(programIds.has(c.eId), `Comment ${c.id} references unknown program ${c.eId}`).toBe(true);
      }
    });
  });

  // ─── REPLIES ───
  describe('INITIAL_REPLIES', () => {
    it('has at least 5 replies', () => {
      expect(INITIAL_REPLIES.length).toBeGreaterThanOrEqual(5);
    });

    it('each reply references a valid comment', () => {
      const commentIds = new Set(INITIAL_COMMENTS.map(c => c.id));
      for (const r of INITIAL_REPLIES) {
        expect(commentIds.has(r.cId), `Reply ${r.id} references unknown comment ${r.cId}`).toBe(true);
      }
    });
  });

  // ─── NOTIFICATIONS ───
  describe('INITIAL_NOTIFICATIONS', () => {
    it('has at least 5 notifications', () => {
      expect(INITIAL_NOTIFICATIONS.length).toBeGreaterThanOrEqual(5);
    });

    it('each notification has type and text', () => {
      for (const n of INITIAL_NOTIFICATIONS) {
        expect(n.type).toBeTruthy();
        expect(n.text).toBeTruthy();
      }
    });
  });

  // ─── IMPL PHASES ───
  describe('INITIAL_IMPL', () => {
    it('has at least 6 implementation phases', () => {
      expect(INITIAL_IMPL.length).toBeGreaterThanOrEqual(6);
    });

    it('each phase has name, items, and gate criteria', () => {
      for (const p of INITIAL_IMPL) {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(Array.isArray(p.items)).toBe(true);
        expect(Array.isArray(p.gc)).toBe(true);
      }
    });
  });

  // ─── DOCS ───
  describe('INITIAL_DOCS', () => {
    it('has at least 10 documents', () => {
      expect(INITIAL_DOCS.length).toBeGreaterThanOrEqual(10);
    });

    it('each doc has required fields', () => {
      for (const d of INITIAL_DOCS) {
        expect(d.id).toBeTruthy();
        expect(d.prgId).toBeTruthy();
        expect(d.name).toBeTruthy();
        expect(d.type).toBeTruthy();
      }
    });
  });
});
