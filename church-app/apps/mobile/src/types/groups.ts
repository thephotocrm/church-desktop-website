// Types matching the desktop API response shapes at fpcd.life/api

export interface GroupResponse {
  id: string;
  name: string;
  description: string;
  type: 'chat' | 'announcement';
  isDefault: boolean;
  createdAt: string;
}

// The API returns nested member objects from /groups/:id/members
export interface GroupMemberResponse {
  id: string;
  groupId: string;
  memberId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
}

export interface ChatMessageResponse {
  id: string;
  groupId: string;
  memberId: string;
  content: string;
  createdAt: string;
  member: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
}

export interface GroupInboxItem extends GroupResponse {
  lastMessage?: ChatMessageResponse | null;
  memberCount?: number;
  unreadCount?: number;
}
