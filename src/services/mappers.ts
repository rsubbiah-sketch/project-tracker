/**
 * Maps backend flat data (ownerId, assigneeId, authorId)
 * to frontend nested objects (owner: User, assignee: User, author: User)
 */
import type { Program, Task, Comment, Reply, Notification, User, ActionItem, Doc } from '../types';

/** Convert Firestore timestamps (or ISO strings) to ISO string */
function toISOString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._seconds) return new Date(val._seconds * 1000).toISOString();
  if (val.seconds) return new Date(val.seconds * 1000).toISOString();
  if (val.toDate) return val.toDate().toISOString();
  return String(val);
}

// Cache users by ID for lookups
let usersMap: Record<string, User> = {};

export function setUsersMap(users: any[]) {
  usersMap = {};
  for (const u of users) {
    usersMap[u.id] = {
      id: u.id,
      name: u.name || u.email?.split('@')[0] || 'Unknown',
      role: u.role || '',
      av: u.av || u.initials || (u.name || '??').split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      team: u.team || '',
    };
  }
}

function lookupUser(id: string | null | undefined): User {
  if (!id) return { id: '', name: 'Unassigned', role: '', av: '?' };
  return usersMap[id] || { id, name: id, role: '', av: id.slice(0, 2).toUpperCase() };
}

export function mapProgram(p: any): Program {
  return {
    id: p.id,
    name: p.name || '',
    type: p.type || 'HW',
    subType: p.subType || '',
    currentPhase: p.currentPhase || 'New',
    owner: lookupUser(p.ownerId) || p.owner,
    assignedBy: lookupUser(p.assignedById) || p.assignedBy || lookupUser(null),
    assignedDate: p.assignedDate || '',
    lastUpdate: toISOString(p.lastUpdate) || toISOString(p.updatedAt),
    deliveryAsk: p.deliveryAsk || p.targetDate || p.target || '',
    deliveryCommit: p.deliveryCommit || '',
    desc: p.description || p.desc || '',
    progress: p.progress || 0,
    team: p.team || 0,
    budget: p.budget || '',
    budgetUsed: p.budgetUsed || 0,
    mode: p.mode || 'planning',
    spark: p.spark || [0, 0, 0, 0, 0, 0, 0],
    milestones: p.milestones || [],
    health: p.health || undefined,
    issues: p.issues || undefined,
    status: p.status,
    phase: p.phase,
    start: p.startDate || p.start,
    target: p.targetDate || p.target,
  };
}

export function mapTask(t: any): Task {
  return {
    id: t.id,
    title: t.title || '',
    prgId: t.programId || t.prgId || '',
    assignee: lookupUser(t.assigneeId) || { id: t.assigneeId, name: t.assigneeName || 'Unassigned', role: '', av: '?' },
    reporter: lookupUser(t.reporterId) || { id: t.reporterId, name: t.reporterName || '', role: '', av: '?' },
    priority: t.priority || 'P1',
    status: t.status || 'Todo',
    due: t.dueDate || t.due || '',
    desc: t.description || t.desc || '',
  };
}

export function mapComment(c: any): Comment {
  return {
    id: c.id,
    eId: c.programId || c.eId || '',
    author: lookupUser(c.authorId) || { id: c.authorId, name: c.authorName || '', role: '', av: '?' },
    body: c.body || '',
    ts: toISOString(c.createdAt) || toISOString(c.ts) || new Date().toISOString(),
    resolved: c.resolved || false,
    likes: c.likes || [],
  };
}

export function mapReply(r: any): Reply {
  return {
    id: r.id,
    cId: r.commentId || r.cId || '',
    author: lookupUser(r.authorId) || { id: r.authorId, name: r.authorName || '', role: '', av: '?' },
    body: r.body || '',
    ts: toISOString(r.createdAt) || toISOString(r.ts) || new Date().toISOString(),
    likes: r.likes || [],
  };
}

export function mapNotification(n: any): Notification {
  return {
    id: n.id,
    type: n.type || '',
    from: lookupUser(n.fromId) || { id: n.fromId, name: n.fromName || '', role: '', av: '?' },
    text: n.message || n.text || '',
    ts: toISOString(n.createdAt) || toISOString(n.ts) || new Date().toISOString(),
    read: n.read || false,
    entityType: n.entityType,
    entityId: n.entityId,
    programId: n.programId,
  };
}

export function mapActionItem(a: any): ActionItem {
  return {
    id: a.id,
    title: a.title || '',
    description: a.description || '',
    status: a.status || 'Open',
    priority: a.priority || 'P1',
    assignee: a.assigneeId ? lookupUser(a.assigneeId) : undefined,
    team: (a.teamIds || []).map((id: string) => lookupUser(id)),
    reporter: lookupUser(a.reporterId) || { id: a.reporterId, name: a.reporterName || '', role: '', av: '?' },
    dueDate: a.dueDate || '',
    tags: a.tags || [],
    createdAt: toISOString(a.createdAt) || new Date().toISOString(),
    updatedAt: toISOString(a.updatedAt) || new Date().toISOString(),
  };
}

export function mapDoc(d: any): Doc {
  return {
    id: d.id,
    prgId: d.programId || d.prgId || '',
    name: d.name || '',
    type: d.type || 'link',
    url: d.url || '',
    addedBy: lookupUser(d.addedById),
    addedAt: toISOString(d.createdAt) || new Date().toISOString(),
    category: d.category || '',
  };
}
