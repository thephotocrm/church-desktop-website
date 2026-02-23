import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BellOff, LogOut, Users, Megaphone, MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../lib/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { GroupMemberResponse } from '../../types/groups';

// ── Component ──────────────────────────────────────────────
export function GroupDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const group = route.params?.group;

  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  // Determine if current user is a platform admin or group admin
  const isPlatformAdmin = user?.role === 'admin';
  const currentUserGroupMember = members.find((gm) => gm.memberId === user?.id);
  const isGroupAdmin = currentUserGroupMember?.role === 'admin';
  const canManageMembers = isPlatformAdmin || isGroupAdmin;

  useEffect(() => {
    if (!token || !group?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const membersList = await api.getGroupMembers(token, group.id);
        if (!cancelled) setMembers(membersList);
      } catch {
        // fail silently
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token, group?.id]);

  const handleLeave = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!token || !group?.id) return;
            setLeaving(true);
            try {
              await api.leaveGroup(token, group.id);
              navigation.popToTop();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to leave group');
              setLeaving(false);
            }
          },
        },
      ],
    );
  };

  const handleMemberAction = (gm: GroupMemberResponse) => {
    if (!canManageMembers) return;

    // Cannot act on yourself
    if (gm.memberId === user?.id) return;

    // Non-platform-admins cannot modify other admins
    if (gm.role === 'admin' && !isPlatformAdmin) return;

    const isTargetAdmin = gm.role === 'admin';
    const memberName = `${gm.member.firstName} ${gm.member.lastName}`;

    const options: string[] = [];
    const actions: (() => void)[] = [];

    if (isTargetAdmin) {
      options.push('Remove Admin');
      actions.push(() => handleRoleChange(gm, 'member'));
    } else {
      options.push('Make Admin');
      actions.push(() => handleRoleChange(gm, 'admin'));
    }

    options.push('Remove from Group');
    actions.push(() => handleRemoveMember(gm));

    options.push('Cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: options.length - 2, // "Remove from Group"
          title: memberName,
        },
        (buttonIndex) => {
          if (buttonIndex < actions.length) {
            actions[buttonIndex]();
          }
        },
      );
    } else {
      // Android fallback using Alert
      Alert.alert(
        memberName,
        'Choose an action',
        [
          ...actions.map((action, i) => ({
            text: options[i],
            onPress: action,
            style: (options[i] === 'Remove from Group' ? 'destructive' : 'default') as 'destructive' | 'default',
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ],
      );
    }
  };

  const handleRoleChange = async (gm: GroupMemberResponse, newRole: 'admin' | 'member') => {
    if (!token || !group?.id) return;
    try {
      await api.updateGroupMemberRole(token, group.id, gm.memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === gm.id ? { ...m, role: newRole } : m)),
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = (gm: GroupMemberResponse) => {
    const memberName = `${gm.member.firstName} ${gm.member.lastName}`;
    Alert.alert(
      'Remove Member',
      `Remove ${memberName} from "${group?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!token || !group?.id) return;
            try {
              await api.removeGroupMember(token, group.id, gm.memberId);
              setMembers((prev) => prev.filter((m) => m.id !== gm.id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove member');
            }
          },
        },
      ],
    );
  };

  const isAnnouncement = group?.type === 'announcement';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View
          style={{
            height: 220,
            position: 'relative',
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 72, color: colors.accent }}>
            {group?.name?.charAt(0) ?? 'G'}
          </Text>

          {/* Back button */}
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={{
              position: 'absolute',
              top: insets.top + 8,
              left: 16,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(0,0,0,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color="#f8fafc" />
          </Pressable>
        </View>

        {/* ── Group info ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              fontSize: 26,
              color: colors.foreground,
              marginBottom: 8,
            }}
          >
            {group?.name ?? 'Group'}
          </Text>

          {/* Group type + member count */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isAnnouncement ? (
                <Megaphone size={14} color={colors.accent} />
              ) : (
                <MessageCircle size={14} color={colors.accent} />
              )}
              <Text
                style={{
                  fontFamily: 'OpenSans_600SemiBold',
                  fontSize: 13,
                  color: colors.mutedForeground,
                  marginLeft: 5,
                }}
              >
                {isAnnouncement ? 'Announcement' : 'Chat Group'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Users size={14} color={colors.accent} />
              <Text
                style={{
                  fontFamily: 'OpenSans_600SemiBold',
                  fontSize: 13,
                  color: colors.mutedForeground,
                  marginLeft: 5,
                }}
              >
                {loading ? '...' : `${members.length} members`}
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 15,
              color: colors.mutedForeground,
              lineHeight: 22,
              marginBottom: 24,
            }}
          >
            {group?.description ?? 'No description available.'}
          </Text>

          {/* ── Action buttons ── */}
          <View style={{ gap: 10, marginBottom: 28 }}>
            <Pressable
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: pressed ? colors.muted : colors.card,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 14,
                paddingHorizontal: 16,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 3,
                  },
                  android: { elevation: 1 },
                }),
              })}
            >
              <BellOff size={18} color={colors.mutedForeground} />
              <Text
                style={{
                  fontFamily: 'OpenSans_600SemiBold',
                  fontSize: 15,
                  color: colors.foreground,
                  marginLeft: 12,
                }}
              >
                Mute Notifications
              </Text>
            </Pressable>

            {/* Hide Leave Group for default groups */}
            {!group?.isDefault && (
              <Pressable
                onPress={handleLeave}
                disabled={leaving}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  opacity: leaving ? 0.5 : 1,
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 3,
                    },
                    android: { elevation: 1 },
                  }),
                })}
              >
                {leaving ? (
                  <ActivityIndicator size="small" color={colors.destructive} />
                ) : (
                  <LogOut size={18} color={colors.destructive} />
                )}
                <Text
                  style={{
                    fontFamily: 'OpenSans_600SemiBold',
                    fontSize: 15,
                    color: colors.destructive,
                    marginLeft: 12,
                  }}
                >
                  Leave Group
                </Text>
              </Pressable>
            )}
          </View>

          {/* ── Members ── */}
          <Text
            style={{
              fontFamily: 'OpenSans_700Bold',
              fontSize: 13,
              color: colors.accent,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 14,
              marginLeft: 4,
            }}
          >
            Members
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ paddingVertical: 20 }} />
          ) : members.length === 0 ? (
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.mutedForeground, textAlign: 'center', paddingVertical: 20 }}>
              No members found.
            </Text>
          ) : (
            members.map((gm) => (
              <Pressable
                key={gm.id}
                onLongPress={() => handleMemberAction(gm)}
                onPress={() => canManageMembers && gm.memberId !== user?.id ? handleMemberAction(gm) : undefined}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                {gm.member.photoUrl ? (
                  <Image
                    source={{ uri: gm.member.photoUrl }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.muted,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: 'OpenSans_700Bold', fontSize: 16, color: '#0f1729' }}>
                      {gm.member.firstName.charAt(0)}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                      style={{
                        fontFamily: 'OpenSans_600SemiBold',
                        fontSize: 15,
                        color: colors.foreground,
                      }}
                    >
                      {gm.member.firstName} {gm.member.lastName}
                    </Text>
                    {gm.role === 'admin' && (
                      <View
                        style={{
                          backgroundColor: colors.accent,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: 'OpenSans_700Bold',
                            fontSize: 10,
                            color: '#0f1729',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          Admin
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 12,
                      color: colors.mutedForeground,
                    }}
                  >
                    {gm.role === 'admin' ? 'Group Admin' : 'Member'}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
