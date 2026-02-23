// Shared types used by both API and mobile app

// Platform roles (in members table on backend)
export type MemberRole = 'admin' | 'group_admin' | 'member' | 'guest';
// Group-level roles (in group_members table on backend)
export type GroupMemberRole = 'admin' | 'member';

/** @deprecated Use MemberRole instead */
export type GlobalRole = MemberRole;
/** @deprecated Use GroupMemberRole instead */
export type GroupRole = GroupMemberRole;

export type UserStatus = 'pending' | 'active' | 'suspended';
export type LivestreamProvider = 'youtube' | 'custom';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  photoUrl?: string | null;
  emailVerified: boolean;
  status: UserStatus;
  role: MemberRole;
  /** @deprecated Use role instead */
  globalRole?: MemberRole;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Sermon {
  id: string;
  title: string;
  description?: string;
  speaker: string;
  date: string;
  audioUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  seriesName?: string;
  createdAt: string;
}

export type EventCategory = 'worship' | 'fellowship' | 'outreach' | 'youth' | 'prayer' | 'general';
export type EventStatus = 'draft' | 'published' | 'cancelled';
export type RsvpStatus = 'attending' | 'maybe' | 'declined';

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  location?: string;
  imageUrl?: string;
  featured: boolean;
  category: EventCategory;
  status: EventStatus;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  parentEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventRsvp {
  id: string;
  eventId: string;
  memberId: string;
  status: RsvpStatus;
  createdAt: string;
}

/** Event detail response including RSVP info */
export interface EventDetail extends Event {
  rsvpCount: { attending: number; maybe: number; declined: number };
  groups?: { id: string; name: string; description?: string | null }[];
  myRsvp?: EventRsvp | null;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  isPinned: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  fundName?: string;
  recurring: boolean;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

export interface LivestreamConfig {
  id: string;
  provider: LivestreamProvider;
  youtubeVideoId?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isLive: boolean;
}
