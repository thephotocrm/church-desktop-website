import type { User, UserStatus, Event, EventDetail, EventCategory, RsvpStatus } from '@church-app/shared';
import type {
  GroupResponse,
  GroupMemberResponse,
  ChatMessageResponse,
} from '../types/groups';

const API_URL = 'https://fpcd.life/api';

// FPC Dallas website URL (serves the live stream API and HLS proxy)
export const STREAM_API_URL = 'https://fpcd.life';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Backend member → mobile User normalizer
// Desktop backend uses firstName/lastName and status 'pending'|'approved'|'rejected'
const STATUS_MAP: Record<string, UserStatus> = {
  pending: 'pending',
  approved: 'active',
  rejected: 'suspended',
};

interface BackendMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  photoUrl?: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export function normalizeMember(m: BackendMember): User {
  return {
    id: m.id,
    name: `${m.firstName} ${m.lastName}`.trim(),
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    phone: m.phone ?? undefined,
    photoUrl: m.photoUrl,
    avatarUrl: m.photoUrl ?? undefined,
    emailVerified: true,
    status: STATUS_MAP[m.status] ?? 'pending',
    role: m.role as User['role'],
    createdAt: m.createdAt,
  };
}

interface AuthResponse {
  member: BackendMember;
  accessToken: string;
  refreshToken: string;
}

export const api = {
  // Auth
  register: (firstName: string, lastName: string, email: string, password: string) =>
    request<AuthResponse>('/members/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/members/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: (token: string) =>
    request<BackendMember>('/members/me', {
      headers: authHeaders(token),
    }),

  // Sermons (public)
  getSermons: (token?: string | null, page = 1) =>
    request<{ data: any[]; total: number }>(`/sermons?page=${page}`, {
      ...(token ? { headers: authHeaders(token) } : {}),
    }),

  // Events (public)
  getEvents: (params?: { startDate?: string; endDate?: string; category?: EventCategory; featured?: boolean; limit?: number; offset?: number }) =>
    request<Event[]>(
      `/events${params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString() : ''}`,
    ),

  getMyEvents: (token: string, params?: { startDate?: string; endDate?: string; category?: EventCategory }) =>
    request<Event[]>(
      `/events/my-events${params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString() : ''}`,
      { headers: authHeaders(token) },
    ),

  getGroupEvents: (token: string, groupId: string, params?: { startDate?: string; endDate?: string; category?: EventCategory }) =>
    request<Event[]>(
      `/events/group/${groupId}${params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString() : ''}`,
      { headers: authHeaders(token) },
    ),

  getEvent: (id: string, token?: string | null) =>
    request<EventDetail>(`/events/${id}`, {
      ...(token ? { headers: authHeaders(token) } : {}),
    }),

  createEvent: (token: string, data: Partial<Event> & { groupIds?: string[] }) =>
    request<Event>('/events/admin', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  rsvpToEvent: (token: string, eventId: string, status: RsvpStatus) =>
    request<{ id: string; eventId: string; memberId: string; status: string; createdAt: string }>(`/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    }),

  cancelRsvp: (token: string, eventId: string) =>
    request<{ message: string }>(`/events/${eventId}/rsvp`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  getIcalUrl: (eventId: string) => `${API_URL}/events/${eventId}/ical`,

  // Announcements (public)
  getAnnouncements: (token?: string | null) =>
    request<{ data: any[] }>('/announcements', {
      ...(token ? { headers: authHeaders(token) } : {}),
    }),

  // Groups
  getGroups: (token: string) =>
    request<GroupResponse[]>('/groups', {
      headers: authHeaders(token),
    }),

  getMyGroups: (token: string) =>
    request<GroupResponse[]>('/members/me/groups', {
      headers: authHeaders(token),
    }),

  joinGroup: (token: string, groupId: string) =>
    request<{ message: string }>(`/groups/${groupId}/join`, {
      method: 'POST',
      headers: authHeaders(token),
    }),

  leaveGroup: (token: string, groupId: string) =>
    request<{ message: string }>(`/groups/${groupId}/leave`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  getGroupMembers: (token: string, groupId: string) =>
    request<GroupMemberResponse[]>(`/groups/${groupId}/members`, {
      headers: authHeaders(token),
    }),

  getGroupMessages: (token: string, groupId: string, limit = 50, before?: string) =>
    request<ChatMessageResponse[]>(
      `/groups/${groupId}/messages?limit=${limit}${before ? `&before=${before}` : ''}`,
      { headers: authHeaders(token) },
    ),

  sendMessage: (token: string, groupId: string, content: string) =>
    request<ChatMessageResponse>(`/groups/${groupId}/messages`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ content }),
    }),

  // Group member management
  removeGroupMember: (token: string, groupId: string, memberId: string) =>
    request<{ message: string }>(`/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  updateGroupMemberRole: (token: string, groupId: string, memberId: string, role: 'admin' | 'member') =>
    request<{ message: string }>(`/groups/${groupId}/members/${memberId}/role`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ role }),
    }),

  // Auth code for cross-platform login (online giving)
  getAuthCode: (token: string) =>
    request<{ code: string }>('/members/auth-code', {
      method: 'POST',
      headers: authHeaders(token),
    }),

  // Token refresh — exchanges refresh token for new access + refresh tokens
  refreshTokens: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>('/members/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  // Account deletion (Apple App Store requirement)
  deleteAccount: (token: string) =>
    request<{ message: string }>('/members/me', {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
};
