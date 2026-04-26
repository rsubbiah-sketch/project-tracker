import { describe, it, expect } from 'vitest';
import { ROLE_HIERARCHY, PERMISSIONS, hasMinRole, hasPermission } from './useRBAC';

describe('RBAC utilities', () => {
  // ─── Role hierarchy ───
  describe('ROLE_HIERARCHY', () => {
    it('defines 4 roles in correct order', () => {
      expect(ROLE_HIERARCHY).toEqual(['viewer', 'commenter', 'editor', 'admin']);
    });
  });

  // ─── hasMinRole ───
  describe('hasMinRole', () => {
    it('viewer meets viewer requirement', () => {
      expect(hasMinRole('viewer', 'viewer')).toBe(true);
    });

    it('viewer does not meet commenter requirement', () => {
      expect(hasMinRole('viewer', 'commenter')).toBe(false);
    });

    it('admin meets all requirements', () => {
      expect(hasMinRole('admin', 'viewer')).toBe(true);
      expect(hasMinRole('admin', 'commenter')).toBe(true);
      expect(hasMinRole('admin', 'editor')).toBe(true);
      expect(hasMinRole('admin', 'admin')).toBe(true);
    });

    it('editor meets editor and below', () => {
      expect(hasMinRole('editor', 'editor')).toBe(true);
      expect(hasMinRole('editor', 'commenter')).toBe(true);
      expect(hasMinRole('editor', 'viewer')).toBe(true);
      expect(hasMinRole('editor', 'admin')).toBe(false);
    });

    it('commenter meets commenter and viewer only', () => {
      expect(hasMinRole('commenter', 'commenter')).toBe(true);
      expect(hasMinRole('commenter', 'viewer')).toBe(true);
      expect(hasMinRole('commenter', 'editor')).toBe(false);
    });

    it('handles case insensitivity', () => {
      expect(hasMinRole('Admin', 'admin')).toBe(true);
      expect(hasMinRole('EDITOR', 'editor')).toBe(true);
    });

    it('unknown role defaults to rank 0 (viewer)', () => {
      expect(hasMinRole('unknown', 'viewer')).toBe(true);
      expect(hasMinRole('unknown', 'commenter')).toBe(false);
    });
  });

  // ─── hasPermission ───
  describe('hasPermission', () => {
    it('viewer can view programs', () => {
      expect(hasPermission('viewer', 'program.view')).toBe(true);
    });

    it('viewer cannot create programs', () => {
      expect(hasPermission('viewer', 'program.create')).toBe(false);
    });

    it('editor can create programs', () => {
      expect(hasPermission('editor', 'program.create')).toBe(true);
    });

    it('commenter can create tasks', () => {
      expect(hasPermission('commenter', 'task.create')).toBe(true);
    });

    it('commenter cannot delete tasks', () => {
      expect(hasPermission('commenter', 'task.delete')).toBe(false);
    });

    it('only admin can delete programs', () => {
      expect(hasPermission('editor', 'program.delete')).toBe(false);
      expect(hasPermission('admin', 'program.delete')).toBe(true);
    });

    it('only admin can access admin views', () => {
      expect(hasPermission('editor', 'admin.view')).toBe(false);
      expect(hasPermission('admin', 'admin.view')).toBe(true);
      expect(hasPermission('admin', 'admin.manage_users')).toBe(true);
    });

    it('editor can add milestones', () => {
      expect(hasPermission('editor', 'milestone.add')).toBe(true);
      expect(hasPermission('commenter', 'milestone.add')).toBe(false);
    });

    it('commenter can link documents', () => {
      expect(hasPermission('commenter', 'doc.link')).toBe(true);
      expect(hasPermission('viewer', 'doc.link')).toBe(false);
    });
  });

  // ─── PERMISSIONS map ───
  describe('PERMISSIONS', () => {
    it('covers all expected permission keys', () => {
      const keys = Object.keys(PERMISSIONS);
      expect(keys).toContain('program.view');
      expect(keys).toContain('program.create');
      expect(keys).toContain('program.delete');
      expect(keys).toContain('task.view');
      expect(keys).toContain('task.create');
      expect(keys).toContain('milestone.add');
      expect(keys).toContain('comment.create');
      expect(keys).toContain('admin.view');
    });

    it('all permission values are valid roles', () => {
      const validRoles = new Set(ROLE_HIERARCHY);
      for (const [key, role] of Object.entries(PERMISSIONS)) {
        expect(validRoles.has(role), `${key} maps to invalid role: ${role}`).toBe(true);
      }
    });
  });
});
