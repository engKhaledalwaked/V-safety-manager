export type AdminUserRole = 'admin' | 'superadmin';

export interface AdminDashboardUser {
  id: string;
  email: string;
  password?: string;
  role: AdminUserRole;
  createdAt?: number;
  updatedAt?: number;
  lastLogin?: number;
}

export interface AdminUserHistoryEntry {
  action: 'created' | 'updated' | 'deleted';
  actorEmail: string | null;
  targetUserId: string;
  targetEmail: string;
  targetRole: AdminUserRole;
  timestamp: number;
  before?: Partial<AdminDashboardUser> | null;
  after?: Partial<AdminDashboardUser> | null;
}
