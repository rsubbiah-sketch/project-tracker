import { describe, it, expect, beforeEach } from 'vitest';
import { setUsersMap, mapProgram, mapTask, mapComment, mapReply, mapNotification } from './mappers';

describe('Data mappers', () => {
  beforeEach(() => {
    setUsersMap([
      { id: 'u1', name: 'Alice Smith', role: 'editor', av: 'AS' },
      { id: 'u2', name: 'Bob Jones', role: 'commenter', av: 'BJ' },
    ]);
  });

  // ─── setUsersMap / lookupUser ───
  describe('mapProgram', () => {
    it('maps flat backend data to frontend Program', () => {
      const result = mapProgram({
        id: 'PRG-001',
        name: 'Test Program',
        type: 'HW',
        subType: 'PRD',
        currentPhase: 'Active',
        ownerId: 'u1',
        assignedById: 'u2',
        assignedDate: '2025-01-01',
        lastUpdate: '2026-03-15T10:00:00',
        deliveryAsk: '2026-12-31',
        deliveryCommit: '2026-12-31',
        description: 'A description',
        progress: 50,
        team: 10,
        budget: '$5M',
        budgetUsed: 30,
        mode: 'active',
        milestones: [{ name: 'M1', date: '2026-06-01', status: 'pending' }],
      });

      expect(result.id).toBe('PRG-001');
      expect(result.name).toBe('Test Program');
      expect(result.type).toBe('HW');
      expect(result.owner.id).toBe('u1');
      expect(result.owner.name).toBe('Alice Smith');
      expect(result.assignedBy.id).toBe('u2');
      expect(result.desc).toBe('A description');
      expect(result.progress).toBe(50);
      expect(result.milestones).toHaveLength(1);
    });

    it('handles missing owner gracefully', () => {
      const result = mapProgram({
        id: 'PRG-002',
        name: 'Test',
        ownerId: 'unknown_user',
      });
      expect(result.owner.id).toBe('unknown_user');
      expect(result.owner.name).toBe('unknown_user'); // fallback
    });

    it('handles null ownerId', () => {
      const result = mapProgram({ id: 'PRG-003', name: 'Test' });
      expect(result.owner.name).toBe('Unassigned');
    });
  });

  describe('mapTask', () => {
    it('maps flat task data to frontend Task', () => {
      const result = mapTask({
        id: 'TK-001',
        title: 'Do Something',
        programId: 'PRG-001',
        assigneeId: 'u1',
        reporterId: 'u2',
        priority: 'P0',
        status: 'In Progress',
        dueDate: '2026-04-01',
        description: 'Task desc',
      });

      expect(result.id).toBe('TK-001');
      expect(result.title).toBe('Do Something');
      expect(result.prgId).toBe('PRG-001');
      expect(result.assignee.name).toBe('Alice Smith');
      expect(result.reporter.name).toBe('Bob Jones');
      expect(result.priority).toBe('P0');
      expect(result.status).toBe('In Progress');
      expect(result.due).toBe('2026-04-01');
    });

    it('handles unassigned task', () => {
      const result = mapTask({ id: 'TK-002', title: 'Unassigned' });
      expect(result.assignee.name).toBe('Unassigned');
    });
  });

  describe('mapComment', () => {
    it('maps backend comment to frontend Comment', () => {
      const result = mapComment({
        id: 'c1',
        programId: 'PRG-001',
        authorId: 'u1',
        body: 'A comment',
        createdAt: '2026-03-15T10:00:00Z',
        resolved: false,
        likes: ['u2'],
      });

      expect(result.id).toBe('c1');
      expect(result.eId).toBe('PRG-001');
      expect(result.author.name).toBe('Alice Smith');
      expect(result.body).toBe('A comment');
      expect(result.resolved).toBe(false);
      expect(result.likes).toEqual(['u2']);
    });
  });

  describe('mapReply', () => {
    it('maps backend reply to frontend Reply', () => {
      const result = mapReply({
        id: 'r1',
        commentId: 'c1',
        authorId: 'u2',
        body: 'A reply',
        createdAt: '2026-03-15T11:00:00Z',
        likes: [],
      });

      expect(result.id).toBe('r1');
      expect(result.cId).toBe('c1');
      expect(result.author.name).toBe('Bob Jones');
      expect(result.body).toBe('A reply');
      expect(result.likes).toEqual([]);
    });
  });

  describe('mapNotification', () => {
    it('maps backend notification to frontend Notification', () => {
      const result = mapNotification({
        id: 'n1',
        type: 'mention',
        fromId: 'u1',
        message: 'mentioned you',
        createdAt: '2026-03-15T12:00:00Z',
        read: false,
      });

      expect(result.id).toBe('n1');
      expect(result.type).toBe('mention');
      expect(result.from.name).toBe('Alice Smith');
      expect(result.text).toBe('mentioned you');
      expect(result.read).toBe(false);
    });
  });

  // ─── Firestore timestamp conversion ───
  describe('timestamp conversion', () => {
    it('handles Firestore _seconds format', () => {
      const result = mapComment({
        id: 'c1',
        createdAt: { _seconds: 1710500000 },
        body: 'test',
      });
      expect(result.ts).toContain('2024-03-15');
    });

    it('handles ISO string format', () => {
      const result = mapComment({
        id: 'c1',
        createdAt: '2026-03-15T10:00:00Z',
        body: 'test',
      });
      expect(result.ts).toBe('2026-03-15T10:00:00Z');
    });
  });
});
