import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import {
  BookOpen,
  HandHeart,
  MapPin,
  Megaphone,
  Play,
  MessageCircle,
  Bell,
  Lock,
  HelpCircle,
  Info,
  LogIn,
  LogOut,
  ChevronRight,
  Pencil,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../lib/useTheme';

// ── Palette ──────────────────────────────────────────────────────
const GOLD = '#C9943A';
const GOLD_LIGHT = '#E8B860';
const WARM_GRAY = '#8C8078';
const RED = '#C05C3A';

// ── Church Tools grid ────────────────────────────────────────────
const TOOLS = [
  { label: 'Bible',         icon: BookOpen,       screen: 'Bible',         bg: 'rgba(201,148,58,0.1)' },
  { label: 'Prayer',        icon: HandHeart,      screen: 'PrayerRequest', bg: 'rgba(124,58,237,0.08)' },
  { label: 'Location',      icon: MapPin,         screen: 'Location',      bg: 'rgba(5,150,105,0.08)' },
  { label: 'Announcements', icon: Megaphone,      screen: 'Announcements', bg: 'rgba(37,99,235,0.08)' },
  { label: 'Watch',         icon: Play,           screen: 'Watch',         bg: 'rgba(192,92,58,0.08)' },
  { label: 'Messages',      icon: MessageCircle,  screen: 'DMList',        bg: 'rgba(219,39,119,0.08)', requiresAuth: true },
];

// ── Settings rows ────────────────────────────────────────────────
const SETTINGS = [
  { label: 'Notifications',    icon: Bell,       screen: 'Notifications',  bg: 'rgba(201,148,58,0.1)' },
  { label: 'Privacy',          icon: Lock,       screen: 'Privacy',        bg: 'rgba(26,23,20,0.05)' },
  { label: 'Help & Support',   icon: HelpCircle, screen: 'Help',           bg: 'rgba(37,99,235,0.08)' },
  { label: 'About FPC Dallas', icon: Info,       screen: 'About',          bg: 'rgba(26,23,20,0.05)' },
];

export function MoreMenuScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const creamBg = isDark ? colors.background : '#FAF7F2';
  const inkColor = isDark ? colors.foreground : '#1A1714';
  const cardBg = isDark ? colors.card : '#FFFFFF';
  const surfaceBg = isDark ? colors.muted : '#F0EBE3';
  const borderColor = isDark ? colors.border : 'rgba(26,23,20,0.07)';

  const handleToolPress = (tool: (typeof TOOLS)[number]) => {
    if (tool.requiresAuth && !isAuthenticated) {
      navigation.navigate('AuthModal');
      return;
    }
    navigation.navigate(tool.screen);
  };

  const handleSettingPress = (setting: (typeof SETTINGS)[number]) => {
    // Navigate or show coming soon — settings screens may not all exist yet
    try {
      navigation.navigate(setting.screen);
    } catch {
      // screen doesn't exist yet
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'FP';

  return (
    <View style={{ flex: 1, backgroundColor: creamBg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Hero Card ── */}
        <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 6, marginBottom: 20 }}>
          {isAuthenticated ? (
            <Pressable
              onPress={() => navigation.navigate('ProfileScreen')}
              className="active:opacity-90"
            >
              <LinearGradient
                colors={['#1A1209', '#3D2B0E', '#5C3D15']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 26,
                  padding: 24,
                  paddingRight: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.18,
                  shadowRadius: 32,
                  elevation: 6,
                  overflow: 'hidden',
                }}
              >
                {/* Gold avatar */}
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: GOLD,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 16,
                    elevation: 4,
                    marginRight: 16,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'PlayfairDisplay_700Bold',
                      fontSize: 24,
                      color: '#1A1714',
                    }}
                  >
                    {initials}
                  </Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: 'PlayfairDisplay_700Bold',
                      fontSize: 20,
                      color: '#fff',
                      letterSpacing: -0.3,
                      lineHeight: 24,
                    }}
                  >
                    {user?.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: 3,
                    }}
                  >
                    {user?.email}
                  </Text>
                  {/* Member badge */}
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(201,148,58,0.2)',
                      borderWidth: 1,
                      borderColor: 'rgba(201,148,58,0.3)',
                      borderRadius: 100,
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      marginTop: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'OpenSans_700Bold',
                        fontSize: 10,
                        color: GOLD_LIGHT,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      Member
                    </Text>
                  </View>
                </View>

                {/* Edit button */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'flex-start',
                  }}
                >
                  <Pencil size={15} color="rgba(255,255,255,0.7)" />
                </View>
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => navigation.navigate('AuthModal')}
              className="active:opacity-90"
            >
              <LinearGradient
                colors={['#1A1209', '#3D2B0E', '#5C3D15']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 26,
                  padding: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.18,
                  shadowRadius: 32,
                  elevation: 6,
                }}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: GOLD,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <LogIn size={24} color="#1A1714" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: 'PlayfairDisplay_700Bold',
                      fontSize: 20,
                      color: '#fff',
                    }}
                  >
                    Sign In
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: 3,
                    }}
                  >
                    Sign in to access all features
                  </Text>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.4)" />
              </LinearGradient>
            </Pressable>
          )}
        </View>

        {/* ── Church Tools Grid ── */}
        <Text
          style={{
            fontFamily: 'OpenSans_700Bold',
            fontSize: 11,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            color: WARM_GRAY,
            paddingHorizontal: 20,
            marginBottom: 10,
          }}
        >
          Church Tools
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: 16,
            gap: 10,
            marginBottom: 24,
          }}
        >
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const locked = tool.requiresAuth && !isAuthenticated;
            return (
              <Pressable
                key={tool.screen}
                onPress={() => handleToolPress(tool)}
                className="active:opacity-80"
                style={{
                  width: '31%',
                  backgroundColor: cardBg,
                  borderRadius: 20,
                  paddingTop: 18,
                  paddingBottom: 14,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: tool.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 9,
                  }}
                >
                  <Icon size={22} color={inkColor} />
                </View>
                <Text
                  style={{
                    fontFamily: 'OpenSans_600SemiBold',
                    fontSize: 11.5,
                    color: inkColor,
                    textAlign: 'center',
                    lineHeight: 14,
                  }}
                >
                  {tool.label}
                </Text>
                {locked && (
                  <Lock
                    size={10}
                    color={WARM_GRAY}
                    style={{ position: 'absolute', top: 10, right: 10 }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Settings ── */}
        <Text
          style={{
            fontFamily: 'OpenSans_700Bold',
            fontSize: 11,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            color: WARM_GRAY,
            paddingHorizontal: 20,
            marginBottom: 10,
          }}
        >
          Settings
        </Text>
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: cardBg,
            borderRadius: 22,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
            marginBottom: 24,
          }}
        >
          {SETTINGS.map((setting, index) => {
            const Icon = setting.icon;
            const isLast = index === SETTINGS.length - 1;
            return (
              <Pressable
                key={setting.label}
                onPress={() => handleSettingPress(setting)}
                className="active:opacity-80"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 15,
                  paddingHorizontal: 18,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: borderColor,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: setting.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Icon size={17} color={inkColor} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: 'OpenSans_600SemiBold',
                    fontSize: 15,
                    color: inkColor,
                  }}
                >
                  {setting.label}
                </Text>
                <ChevronRight size={14} color="rgba(26,23,20,0.2)" />
              </Pressable>
            );
          })}
        </View>

        {/* ── Sign Out ── */}
        {isAuthenticated && (
          <Pressable
            onPress={logout}
            className="active:opacity-80"
            style={{
              marginHorizontal: 16,
              paddingVertical: 16,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: 'rgba(192,92,58,0.25)',
              backgroundColor: 'rgba(192,92,58,0.06)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={16} color={RED} style={{ marginRight: 8 }} />
            <Text
              style={{
                fontFamily: 'OpenSans_700Bold',
                fontSize: 14,
                color: RED,
              }}
            >
              Sign Out
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
