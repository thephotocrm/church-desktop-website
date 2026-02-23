import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Info, Send, VolumeX } from 'lucide-react-native';
import { useTheme } from '../../lib/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { useGroupChat } from '../../hooks/useGroupChat';
import type { ChatMessageResponse, GroupMemberResponse } from '../../types/groups';

// ── Helpers ─────────────────────────────────────────────────
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

// Group consecutive messages from same sender (inverted list)
function shouldShowSender(messages: ChatMessageResponse[], index: number, userId: string | undefined): boolean {
  if (messages[index].memberId === userId) return false; // Never show sender for own messages
  if (index === messages.length - 1) return true; // Top of list (inverted)
  return messages[index].memberId !== messages[index + 1].memberId;
}

// ── Component ──────────────────────────────────────────────
export function GroupChatScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [text, setText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const group = route.params?.group;
  const groupId = group?.id;

  // Check if user can post in this group
  const isAnnouncement = group?.type === 'announcement';
  const isPlatformAdmin = user?.role === 'admin';
  const [userGroupRole, setUserGroupRole] = useState<'admin' | 'member' | null>(null);

  useEffect(() => {
    if (!token || !groupId || !isAnnouncement) return;
    let cancelled = false;

    (async () => {
      try {
        const members = await api.getGroupMembers(token, groupId);
        const me = members.find((gm: GroupMemberResponse) => gm.memberId === user?.id);
        if (!cancelled) setUserGroupRole(me?.role ?? 'member');
      } catch {
        if (!cancelled) setUserGroupRole('member');
      }
    })();

    return () => { cancelled = true; };
  }, [token, groupId, isAnnouncement, user?.id]);

  const canPost = !isAnnouncement || isPlatformAdmin || userGroupRole === 'admin';

  // Load initial message history
  const [initialMessages, setInitialMessages] = useState<ChatMessageResponse[]>([]);

  useEffect(() => {
    if (!token || !groupId) return;
    let cancelled = false;

    (async () => {
      try {
        const msgs = await api.getGroupMessages(token, groupId, 50);
        if (cancelled) return;
        setInitialMessages(msgs);
        setHasMore(msgs.length >= 50);
      } catch {
        // fail silently
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token, groupId]);

  // WebSocket hook — only init after history loads
  const { messages, sendMessage: wsSend, isConnected, setMessages } = useGroupChat({
    groupId,
    token: token!,
    initialMessages,
  });

  // Inverted messages (newest first for FlatList inverted)
  const invertedMessages = [...messages].reverse();

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    wsSend(content);
    setText('');
  };

  const loadOlderMessages = useCallback(async () => {
    if (!token || !groupId || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0]; // earliest message
      const olderMsgs = await api.getGroupMessages(token, groupId, 50, oldest.id);
      if (olderMsgs.length > 0) {
        setMessages((prev) => [...olderMsgs, ...prev]);
      }
      setHasMore(olderMsgs.length >= 50);
    } catch {
      // fail silently
    } finally {
      setLoadingMore(false);
    }
  }, [token, groupId, loadingMore, hasMore, messages, setMessages]);

  const renderMessage = ({ item, index }: { item: ChatMessageResponse; index: number }) => {
    const isMe = item.memberId === user?.id;
    const showSender = shouldShowSender(invertedMessages, index, user?.id);

    return (
      <View
        style={{
          alignItems: isMe ? 'flex-end' : 'flex-start',
          marginBottom: showSender ? 12 : 3,
          paddingHorizontal: 16,
        }}
      >
        {/* Sender name */}
        {showSender && !isMe && (
          <Text
            style={{
              fontFamily: 'OpenSans_600SemiBold',
              fontSize: 12,
              color: colors.accent,
              marginBottom: 3,
              marginLeft: 4,
            }}
          >
            {item.member?.firstName ?? 'Unknown'} {item.member?.lastName ?? ''}
          </Text>
        )}

        {/* Bubble */}
        <View
          style={{
            maxWidth: '78%',
            backgroundColor: isMe ? colors.accent : colors.card,
            borderRadius: 18,
            borderTopLeftRadius: !isMe ? 4 : 18,
            borderTopRightRadius: isMe ? 4 : 18,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: isMe ? 0 : 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 15,
              color: isMe ? '#0f1729' : colors.foreground,
              lineHeight: 21,
            }}
          >
            {item.content}
          </Text>
          <Text
            style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 10,
              color: isMe ? 'rgba(15,23,41,0.5)' : colors.mutedForeground,
              marginTop: 4,
              alignSelf: 'flex-end',
            }}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const memberCount = group?.memberCount ?? group?.members ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: colors.primary,
          paddingTop: insets.top + 4,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={{ padding: 4 }}
        >
          <ArrowLeft size={24} color="#f8fafc" />
        </Pressable>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'OpenSans_700Bold',
              fontSize: 17,
              color: '#f8fafc',
            }}
          >
            {group?.name ?? 'Group Chat'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isConnected && (
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' }} />
            )}
            <Text
              style={{
                fontFamily: 'OpenSans_400Regular',
                fontSize: 12,
                color: 'rgba(248,250,252,0.6)',
              }}
            >
              {isConnected ? 'Connected' : 'Connecting...'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate('GroupDetail', { group })}
          hitSlop={12}
          style={{ padding: 4 }}
        >
          <Info size={22} color="#f8fafc" />
        </Pressable>
      </View>

      {/* ── Date separator ── */}
      {messages.length > 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontFamily: 'OpenSans_600SemiBold',
                fontSize: 11,
                color: colors.mutedForeground,
              }}
            >
              {formatDateLabel(messages[messages.length - 1]?.createdAt)}
            </Text>
          </View>
        </View>
      )}

      {/* ── Messages ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loadingHistory ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={invertedMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={{ paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            onEndReached={loadOlderMessages}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator size="small" color={colors.accent} style={{ paddingVertical: 12 }} />
              ) : null
            }
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.mutedForeground }}>
                  No messages yet. Start the conversation!
                </Text>
              </View>
            }
          />
        )}

        {/* ── Input bar or read-only banner ── */}
        {canPost ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              paddingHorizontal: 12,
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: colors.card,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={{
                flex: 1,
                fontFamily: 'OpenSans_400Regular',
                fontSize: 15,
                color: colors.foreground,
                backgroundColor: colors.background,
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: 10,
                maxHeight: 100,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <Pressable
              onPress={handleSend}
              disabled={!text.trim()}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: pressed ? '#c99a06' : colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 8,
                opacity: text.trim() ? 1 : 0.5,
              })}
            >
              <Send size={18} color="#0f1729" />
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: Math.max(insets.bottom, 14),
              backgroundColor: colors.muted,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              gap: 8,
            }}
          >
            <VolumeX size={16} color={colors.mutedForeground} />
            <Text
              style={{
                fontFamily: 'OpenSans_600SemiBold',
                fontSize: 13,
                color: colors.mutedForeground,
              }}
            >
              Only admins can post in this channel
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
