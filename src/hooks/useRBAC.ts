import { useCurrentUser } from './useCurrentUser';

/**
 * Role hierarchy (higher index = more permissions):
 *   viewer (0) < commenter (1) < editor (2) < admin (3)
 */
export const ROLE_HIERARCHY = ['viewer', 'commenter', 'editor', 'admin'] as const;
export type RBACRole = (typeof ROLE_HIERARCHY)[number];

const ROLE_RANK: Record<string, number> = {
  viewer: 0,
  commenter: 1,
  editor: 2,
  admin: 3,
};

/** Permissions matrix keyed by minimum required role */
export const PERMISSIONS = {
  // Programs
  'program.view': 'viewer',
  'program.create': 'editor',
  'program.edit': 'editor',
  'program.delete': 'admin',

  // Milestones
  'milestone.view': 'viewer',
  'milestone.add': 'editor',
  'milestone.edit.own': 'commenter',
  'milestone.edit.any': 'editor',
  'milestone.delete': 'editor',

  // Tasks
  'task.view': 'viewer',
  'task.create': 'commenter',
  'task.edit.own': 'commenter',
  'task.edit.any': 'editor',
  'task.delete': 'editor',
  'task.reassign': 'editor',

  // Documents
  'doc.view': 'viewer',
  'doc.link': 'commenter',
  'doc.remove': 'editor',

  // Comments
  'comment.view': 'viewer',
  'comment.create': 'commenter',
  'comment.delete.own': 'commenter',
  'comment.delete.any': 'admin',

  // Admin & Teams
  'admin.view': 'admin',
  'admin.manage_users': 'admin',
  'admin.manage_teams': 'admin',
  'admin.view_audit': 'admin',
} as const;

export type Permission = keyof typeof PERMISSIONS;

function getRank(role: string | undefined | null): number {
  if (!role) return 0;
  return ROLE_RANK[role.toLowerCase()] ?? 0;
}

/**
 * Check if a role meets or exceeds the minimum required role.
 */
export function hasMinRole(userRole: string, minRole: string): boolean {
  return getRank(userRole) >= getRank(minRole);
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  const minRole = PERMISSIONS[permission];
  return hasMinRole(userRole, minRole);
}

/**
 * Users allowed to create programs (program-admin).
 * Identified by name — admins always have this right.
 */
const PROGRAM_ADMINS = [
  'Julissa Benavente',
  'Rajendran Subbiah',
  'Aravind Srikumar',
];

/**
 * React hook that provides RBAC utilities for the current user.
 */
export function useRBAC() {
  const user = useCurrentUser();
  const role = (user.role || 'viewer').toLowerCase();

  return {
    role,
    isAdmin: role === 'admin',
    isEditor: hasMinRole(role, 'editor'),
    isCommenter: hasMinRole(role, 'commenter'),
    isViewer: true, // everyone is at least a viewer
    isProgramAdmin: role === 'admin' || PROGRAM_ADMINS.includes(user.name),
    can: (permission: Permission) => hasPermission(role, permission),
    hasMinRole: (minRole: string) => hasMinRole(role, minRole),
    rank: getRank(role),
  };
}
