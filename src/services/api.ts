import type {
  Program,
  Task,
  Comment,
  Reply,
  Notification,
  User,
  ImplPhase,
  ActionItem,
} from '../types';

// ---------------------------------------------------------------------------
// Base URL configuration
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Derive the root URL (without the /api suffix) for endpoints that sit
 * outside the /api namespace (e.g. /auth/*).
 */
const ROOT_BASE = API_BASE.replace(/\/api\/?$/, '');

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  base: string = API_BASE,
): Promise<T> {
  const method = options.method || 'GET';
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    console.warn(`[API] ${method} ${path} → ${res.status}:`, err.error);
    throw new Error(err.error || `API error ${res.status}`);
  }

  const data = await res.json();
  if (method !== 'GET') console.info(`[API] ${method} ${path} → saved ✓`);
  return data;
}

// ---------------------------------------------------------------------------
// Filter / payload types
// ---------------------------------------------------------------------------

export interface ProgramFilters {
  type?: string;
  status?: string;
  owner?: string;
  search?: string;
}

export interface TaskFilters {
  programId?: string;
  assignee?: string;
  status?: string;
  priority?: string;
  search?: string;
}

export interface CreateProgramPayload {
  name: string;
  type: string;
  subType?: string;
  currentPhase?: string;
  description?: string;
  assignedById?: string;
  assignedByName?: string;
  assignedDate?: string;
  deliveryAsk?: string;
  deliveryCommit?: string;
  team?: number;
  budget?: string;
  mode?: string;
  milestones?: { name: string; date: string; status: string }[];
}

export type UpdateProgramPayload = Partial<CreateProgramPayload> & {
  health?: any;
  issues?: any[];
  progress?: number;
  spark?: number[];
  lastUpdate?: string;
};

export interface ApproveGatePayload {
  phase: string;
  approved: boolean;
  notes?: string;
}

export interface CreateTaskPayload {
  title: string;
  programId: string;
  assigneeId: string;
  reporterId?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  description?: string;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export interface CreateCommentPayload {
  programId: string;
  body: string;
}

export interface CreateReplyPayload {
  commentId: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

function toQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    (e): e is [string, string] => e[1] !== undefined,
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}

export function fetchPrograms(filters?: ProgramFilters): Promise<Program[]> {
  const qs = filters ? toQuery(filters as Record<string, string | undefined>) : '';
  return apiFetch<Program[]>(`/programs${qs}`);
}

export function fetchProgram(id: string): Promise<Program> {
  return apiFetch<Program>(`/programs/${id}`);
}

export function createProgram(data: CreateProgramPayload): Promise<Program> {
  return apiFetch<Program>('/programs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProgram(id: string, data: UpdateProgramPayload): Promise<Program> {
  return apiFetch<Program>(`/programs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function activateProgram(id: string): Promise<Program> {
  return apiFetch<Program>(`/programs/${id}/activate`, { method: 'POST' });
}

export function approveGate(id: string, data: ApproveGatePayload): Promise<Program> {
  return apiFetch<Program>(`/programs/${id}/approve-gate`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteProgram(id: string): Promise<void> {
  return apiFetch<void>(`/programs/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function fetchTasks(filters?: TaskFilters): Promise<Task[]> {
  const qs = filters ? toQuery(filters as Record<string, string | undefined>) : '';
  return apiFetch<Task[]>(`/tasks${qs}`);
}

export function fetchMyTasks(): Promise<Task[]> {
  return apiFetch<Task[]>('/tasks/mine');
}

export function createTask(data: CreateTaskPayload): Promise<Task> {
  return apiFetch<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTask(id: string, data: UpdateTaskPayload): Promise<Task> {
  return apiFetch<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function reassignTask(id: string, assigneeId: string): Promise<Task> {
  return apiFetch<Task>(`/tasks/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ assigneeId }),
  });
}

export function deleteTask(id: string): Promise<void> {
  return apiFetch<void>(`/tasks/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export function fetchComments(programId: string): Promise<Comment[]> {
  return apiFetch<Comment[]>(`/comments?programId=${encodeURIComponent(programId)}`);
}

export function createComment(data: CreateCommentPayload): Promise<Comment> {
  return apiFetch<Comment>('/comments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function toggleCommentLike(id: string): Promise<Comment> {
  return apiFetch<Comment>(`/comments/${id}/like`, { method: 'PATCH' });
}

export function toggleCommentResolve(id: string): Promise<Comment> {
  return apiFetch<Comment>(`/comments/${id}/resolve`, { method: 'PATCH' });
}

// ---------------------------------------------------------------------------
// Replies
// ---------------------------------------------------------------------------

export function fetchReplies(commentId: string): Promise<Reply[]> {
  return apiFetch<Reply[]>(`/replies?commentId=${encodeURIComponent(commentId)}`);
}

export function createReply(data: CreateReplyPayload): Promise<Reply> {
  return apiFetch<Reply>('/replies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function toggleReplyLike(id: string): Promise<Reply> {
  return apiFetch<Reply>(`/replies/${id}/like`, { method: 'PATCH' });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function fetchNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>('/notifications');
}

export function markNotificationRead(id: string): Promise<Notification> {
  return apiFetch<Notification>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>('/notifications/mark-all-read', { method: 'POST' });
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>('/users');
}

export function updateUser(userId: string, data: { role?: string; team?: string }): Promise<User> {
  return apiFetch<User>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function fetchAuditLog(filters?: { action?: string; userId?: string }): Promise<any[]> {
  const qs = filters ? toQuery(filters as Record<string, string | undefined>) : '';
  return apiFetch<any[]>(`/audit-log${qs}`);
}

// ---------------------------------------------------------------------------
// Implementation Phases
// ---------------------------------------------------------------------------

export function fetchImplPhases(): Promise<ImplPhase[]> {
  return apiFetch<ImplPhase[]>('/impl-phases');
}

export function updateImplTaskStatus(
  phaseId: string,
  taskId: string,
  status: string,
): Promise<ImplPhase> {
  return apiFetch<ImplPhase>(`/impl-phases/${phaseId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export function fetchDocuments(programId?: string): Promise<any[]> {
  const qs = programId ? `?programId=${encodeURIComponent(programId)}` : '';
  return apiFetch<any[]>(`/documents${qs}`);
}

export function createDocument(data: { programId: string; name: string; type: string; url: string; category?: string }): Promise<any> {
  return apiFetch<any>('/documents', { method: 'POST', body: JSON.stringify(data) });
}

export function deleteDocument(id: string): Promise<void> {
  return apiFetch<void>(`/documents/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function fetchCurrentUser(): Promise<User> {
  return apiFetch<User>('/auth/me', {}, ROOT_BASE);
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' }, ROOT_BASE);
}

// ---------------------------------------------------------------------------
// Admin — Additional endpoints
// ---------------------------------------------------------------------------

export function createUser(data: { email: string; name: string; role?: string; team?: string }): Promise<User> {
  return apiFetch<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteUser(userId: string): Promise<void> {
  return apiFetch<void>(`/users/${userId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Program Members (per-program roles)
// ---------------------------------------------------------------------------

export interface ProgramMember {
  id: string;
  programId: string;
  userId: string;
  role: 'editor' | 'commenter' | 'viewer';
  assignedById: string;
  assignedByName: string;
  assignedAt: string;
}

export interface MyProgramRole {
  programId: string;
  userId: string;
  role: string;
  isOwner: boolean;
}

export function fetchMyProgramRole(programId: string): Promise<MyProgramRole> {
  return apiFetch<MyProgramRole>(`/program-members/my-role/${programId}`);
}

export function fetchProgramMembers(programId: string): Promise<ProgramMember[]> {
  return apiFetch<ProgramMember[]>(`/program-members?programId=${programId}`);
}

export function assignProgramRole(data: { programId: string; userId: string; role: string }): Promise<ProgramMember> {
  return apiFetch<ProgramMember>('/program-members', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function removeProgramMember(id: string): Promise<void> {
  return apiFetch<void>(`/program-members/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Action Items (independent of programs)
// ---------------------------------------------------------------------------

export interface ActionItemFilters {
  assignee?: string;
  status?: string;
  priority?: string;
  search?: string;
}

export function fetchActionItems(filters?: ActionItemFilters): Promise<ActionItem[]> {
  const qs = filters ? toQuery(filters as Record<string, string | undefined>) : '';
  return apiFetch<ActionItem[]>(`/action-items${qs}`);
}

export function createActionItem(data: {
  title: string;
  description?: string;
  assigneeId?: string;
  teamIds?: string[];
  priority?: string;
  dueDate?: string;
  tags?: string[];
}): Promise<ActionItem> {
  return apiFetch<ActionItem>('/action-items', { method: 'POST', body: JSON.stringify(data) });
}

export function updateActionItem(id: string, data: Record<string, any>): Promise<ActionItem> {
  return apiFetch<ActionItem>(`/action-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteActionItem(id: string): Promise<void> {
  return apiFetch<void>(`/action-items/${id}`, { method: 'DELETE' });
}
