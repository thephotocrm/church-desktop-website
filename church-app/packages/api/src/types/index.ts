export type GlobalRole = 'super_admin' | 'admin' | 'pastor' | 'staff' | 'member';
export type GroupRole = 'group_leader' | 'moderator' | 'group_member';
export type UserStatus = 'pending' | 'active' | 'suspended';
export type LivestreamProvider = 'youtube' | 'custom';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
