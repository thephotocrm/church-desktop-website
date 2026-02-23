import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, Megaphone, Users, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../lib/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { AuthRequiredScreen } from '../auth/AuthRequiredScreen';
import type { GroupResponse, GroupInboxItem, ChatMessageResponse } from '../../types/groups';

// ── Palette ──────────────────────────────────────────────────────
const GOLD = '#C9943A';
const WARM_GRAY = '#8C8078';

// ── Banner colors for My Group cards ─────────────────────────────
const BANNER_COLORS = [
  { bg: '#3D2B0E', text: '#E8B860' },
  { bg: '#1A2940', text: '#7EB8E0' },
  { bg: '#2D1B3D', text: '#C89EE8' },
  { bg: '#1A3329', text: '#7EC8A0' },
  { bg: '#3D1A1A', text: '#E8A07E' },
];

// ── Category filter labels ───────────────────────────────────────
const FILTERS = ['All', 'Men', 'Women', 'Youth', 'Family', 'Seniors'];

// ── Discover card emoji/tag styling ──────────────────────────────
const TAG_STYLES: Record<string, { bg: string; color: string; emoji: string }> = {
  men:     { bg: 'rgba(37,99,235,0.1)',  color: '#2563EB', emoji: '🛡️' },
  women:   { bg: 'rgba(219,39,119,0.1)', color: '#DB2777', emoji: '🌸' },
  youth:   { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED', emoji: '⚡' },
  family:  { bg: 'rgba(5,150,105,0.1)',  color: '#059669', emoji: '👨‍👩‍👧' },
  seniors: { bg: 'rgba(201,148,58,0.12)', color: GOLD,     emoji: '☕' },
  general: { bg: 'rgba(26,23,20,0.07)',  color: WARM_GRAY, emoji: '👥' },
};

function guessTag(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('men') && !lower.includes('women')) return 'men';
  if (lower.includes('women') || lower.includes('ladies') || lower.includes('sister')) return 'women';
  if (lower.includes('youth') || lower.includes('teen') || lower.includes('young adult')) return 'youth';
  if (lower.includes('famil')) return 'family';
  if (lower.includes('senior') || lower.includes('elder')) return 'seniors';
  return 'general';
}

// ── Helpers ──────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

// ── Component ────────────────────────────────────────────────────
export function GroupsScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { token, isAuthenticated } = useAuth();

  const [myGroups, setMyGroups] = useState<GroupInboxItem[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const creamBg = isDark ? colors.background : '#FAF7F2';
  const inkColor = isDark ? colors.foreground : '#1A1714';
  const cardBg = isDark ? colors.card : '#FFFFFF';
  const surfaceBg = isDark ? colors.muted : '#F0EBE3';
  const borderColor = isDark ? colors.border : 'rgba(26,23,20,0.07)';

  const loadGroups = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [myGroupsList, allGroupsList] = await Promise.all([
        api.getMyGroups(token),
        api.getGroups(token),
      ]);

      const myGroupIds = new Set(myGroupsList.map((g) => g.id));

      const enriched: GroupInboxItem[] = await Promise.all(
        myGroupsList.map(async (group) => {
          let lastMessage: ChatMessageResponse | null = null;
          try {
            const msgs = await api.getGroupMessages(token, group.id, 1);
            lastMessage = msgs[0] ?? null;
          } catch {
            // OK — group may have no messages
          }
          return { ...group, lastMessage };
        }),
      );

      enriched.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.createdAt;
        const bTime = b.lastMessage?.createdAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setMyGroups(enriched);
      setDiscoverGroups(allGroupsList.filter((g) => !myGroupIds.has(g.id) && !g.isDefault));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups]),
  );

  const handleJoin = async (group: GroupResponse) => {
    if (!token) return;
    setJoiningId(group.id);
    try {
      await api.joinGroup(token, group.id);
      await loadGroups();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to join group');
    } finally {
      setJoiningId(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  if (!isAuthenticated) return <AuthRequiredScreen featureName="Groups" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: creamBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  // Filter discover groups
  const filteredDiscover = discoverGroups.filter((g) => {
    const tag = guessTag(g.name);
    const matchFilter = activeFilter === 'All' || tag === activeFilter.toLowerCase();
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: creamBg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
        }
      >
        {/* ── Header ── */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 10,
            paddingBottom: 20,
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                fontSize: 30,
                color: inkColor,
                letterSpacing: -0.5,
                lineHeight: 34,
              }}
            >
              Groups
            </Text>
            <Text
              style={{
                fontFamily: 'OpenSans_400Regular',
                fontSize: 13,
                color: WARM_GRAY,
                marginTop: 4,
              }}
            >
              Stay connected
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('GroupDetail', {})}
            className="active:opacity-80"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: inkColor,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Plus size={20} color="#fff" />
          </Pressable>
        </View>

        {/* ── Search ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: cardBg,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 13,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <Search size={16} color={WARM_GRAY} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search groups..."
              placeholderTextColor={WARM_GRAY}
              style={{
                flex: 1,
                fontFamily: 'OpenSans_400Regular',
                fontSize: 14,
                color: inkColor,
                marginLeft: 10,
                padding: 0,
              }}
            />
          </View>
        </View>

        {/* ── Category Filters ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 22 }}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                className="active:opacity-80"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 100,
                  borderWidth: 1.5,
                  borderColor: isActive ? inkColor : borderColor,
                  backgroundColor: isActive ? inkColor : cardBg,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'OpenSans_600SemiBold',
                    fontSize: 13,
                    color: isActive ? '#fff' : WARM_GRAY,
                  }}
                >
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── My Groups (horizontal scroll) ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontFamily: 'OpenSans_700Bold',
              fontSize: 11,
              letterSpacing: 1.8,
              textTransform: 'uppercase',
              color: WARM_GRAY,
            }}
          >
            My Groups
          </Text>
          <Pressable className="active:opacity-70">
            <Text
              style={{ fontFamily: 'OpenSans_600SemiBold', fontSize: 12, color: GOLD }}
            >
              See all
            </Text>
          </Pressable>
        </View>

        {myGroups.length === 0 ? (
          <Text
            style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 14,
              color: WARM_GRAY,
              textAlign: 'center',
              paddingVertical: 24,
              paddingHorizontal: 20,
            }}
          >
            You haven't joined any groups yet.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}
          >
            {myGroups.map((group, index) => {
              const banner = BANNER_COLORS[index % BANNER_COLORS.length];
              const lastTime = group.lastMessage
                ? timeAgo(group.lastMessage.createdAt)
                : null;
              const preview = group.lastMessage
                ? `${group.lastMessage.member?.firstName ?? 'Unknown'}: ${group.lastMessage.content}`
                : 'No messages yet';

              return (
                <Pressable
                  key={group.id}
                  onPress={() => navigation.navigate('GroupChat', { group })}
                  className="active:opacity-80"
                  style={{
                    width: 160,
                    backgroundColor: cardBg,
                    borderRadius: 22,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.08,
                    shadowRadius: 14,
                    elevation: 3,
                  }}
                >
                  {/* Colored banner */}
                  <View
                    style={{
                      height: 72,
                      backgroundColor: banner.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 23,
                        backgroundColor: cardBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'PlayfairDisplay_700Bold',
                          fontSize: 20,
                          color: banner.text,
                        }}
                      >
                        {group.name.charAt(0)}
                      </Text>
                    </View>
                    {/* Announcement badge or unread dot */}
                    {group.type === 'announcement' ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 12,
                        }}
                      >
                        <Megaphone size={12} color={banner.text} />
                      </View>
                    ) : (group.unreadCount ?? 0) > 0 ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 14,
                          width: 9,
                          height: 9,
                          borderRadius: 5,
                          backgroundColor: GOLD,
                          borderWidth: 2,
                          borderColor: cardBg,
                        }}
                      />
                    ) : null}
                  </View>

                  {/* Card body */}
                  <View style={{ padding: 13, paddingTop: 10 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: 'OpenSans_700Bold',
                        fontSize: 14,
                        color: inkColor,
                        marginBottom: 3,
                      }}
                    >
                      {group.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: 'OpenSans_400Regular',
                        fontSize: 11.5,
                        color: WARM_GRAY,
                      }}
                    >
                      {preview}
                    </Text>
                    {lastTime && (
                      <Text
                        style={{
                          fontFamily: 'OpenSans_600SemiBold',
                          fontSize: 10,
                          color: GOLD,
                          marginTop: 6,
                        }}
                      >
                        {lastTime} ago
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}

            {/* Join more CTA card */}
            <Pressable
              className="active:opacity-70"
              style={{
                width: 160,
                minHeight: 148,
                backgroundColor: surfaceBg,
                borderRadius: 22,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: borderColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 28, color: WARM_GRAY, marginBottom: 6 }}>+</Text>
              <Text
                style={{
                  fontFamily: 'OpenSans_600SemiBold',
                  fontSize: 12,
                  color: WARM_GRAY,
                  textAlign: 'center',
                  paddingHorizontal: 12,
                }}
              >
                Join a new group
              </Text>
            </Pressable>
          </ScrollView>
        )}

        {/* ── Discover ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontFamily: 'OpenSans_700Bold',
              fontSize: 11,
              letterSpacing: 1.8,
              textTransform: 'uppercase',
              color: WARM_GRAY,
            }}
          >
            Discover
          </Text>
          <Pressable className="active:opacity-70">
            <Text
              style={{ fontFamily: 'OpenSans_600SemiBold', fontSize: 12, color: GOLD }}
            >
              Browse all
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {filteredDiscover.length === 0 ? (
            <Text
              style={{
                fontFamily: 'OpenSans_400Regular',
                fontSize: 14,
                color: WARM_GRAY,
                textAlign: 'center',
                paddingVertical: 40,
              }}
            >
              {search
                ? `No groups found for "${search}"`
                : 'No groups to discover right now'}
            </Text>
          ) : (
            filteredDiscover.map((group) => {
              const tag = guessTag(group.name);
              const style = TAG_STYLES[tag] ?? TAG_STYLES.general;
              const tagLabel = tag.charAt(0).toUpperCase() + tag.slice(1);

              return (
                <Pressable
                  key={group.id}
                  onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
                  className="active:opacity-80"
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 22,
                    padding: 16,
                    paddingRight: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 2,
                  }}
                >
                  {/* Emoji avatar */}
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      backgroundColor: style.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{style.emoji}</Text>
                  </View>

                  {/* Body */}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: 'OpenSans_700Bold',
                        fontSize: 15,
                        color: inkColor,
                        marginBottom: 2,
                      }}
                    >
                      {group.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Users size={11} color={WARM_GRAY} style={{ marginRight: 4 }} />
                      <Text
                        style={{
                          fontFamily: 'OpenSans_400Regular',
                          fontSize: 12,
                          color: WARM_GRAY,
                        }}
                      >
                        {group.description || 'Open group'}
                      </Text>
                    </View>
                    {/* Tag pill */}
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: style.bg,
                        paddingHorizontal: 9,
                        paddingVertical: 3,
                        borderRadius: 100,
                        marginTop: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'OpenSans_700Bold',
                          fontSize: 10,
                          letterSpacing: 0.3,
                          color: style.color,
                        }}
                      >
                        {tagLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Join button */}
                  <Pressable
                    onPress={() => handleJoin(group)}
                    disabled={joiningId === group.id}
                    className="active:opacity-70"
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 100,
                      borderWidth: 1.5,
                      borderColor: borderColor,
                      backgroundColor: surfaceBg,
                      opacity: joiningId === group.id ? 0.6 : 1,
                      marginLeft: 8,
                    }}
                  >
                    {joiningId === group.id ? (
                      <ActivityIndicator size="small" color={inkColor} />
                    ) : (
                      <Text
                        style={{
                          fontFamily: 'OpenSans_700Bold',
                          fontSize: 12,
                          color: inkColor,
                        }}
                      >
                        Join
                      </Text>
                    )}
                  </Pressable>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
