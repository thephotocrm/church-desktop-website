import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, MapPin, Radio, Users, Calendar, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../lib/useTheme';
import { useStreamStatus } from '../../hooks/useStreamStatus';

const RECENT_SERVICES = [
  {
    id: '1',
    title: 'Sunday Prayer',
    speaker: 'Pastor Johnson',
    duration: '1 hr 30 min',
    tag: 'Worship',
    tagColor: '#7C3AED',

    image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400&q=80',
  },
  {
    id: '2',
    title: 'The Power of Prayer',
    speaker: 'Pastor Johnson',
    duration: '52 min',
    tag: 'Sermon',
    tagColor: '#059669',

    image: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=400&q=80',
  },
  {
    id: '3',
    title: 'Grace That Transforms',
    speaker: 'Rev. Williams',
    duration: '38 min',
    tag: 'Bible Study',
    tagColor: '#92400E',

    image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400&q=80',
  },
];

const DAILY_VERSES = [
  { text: 'Be still, and know that I am God.', ref: 'Psalm 46:10' },
  { text: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
  { text: 'Trust in the Lord with all your heart.', ref: 'Proverbs 3:5' },
  { text: 'I can do all things through Christ.', ref: 'Philippians 4:13' },
  { text: 'The Lord is my light and my salvation.', ref: 'Psalm 27:1' },
  { text: 'For God so loved the world.', ref: 'John 3:16' },
  { text: 'Cast all your anxiety on him.', ref: '1 Peter 5:7' },
  { text: 'The joy of the Lord is your strength.', ref: 'Nehemiah 8:10' },
  { text: 'God is our refuge and strength.', ref: 'Psalm 46:1' },
  { text: 'Walk by faith, not by sight.', ref: '2 Corinthians 5:7' },
  { text: 'His mercies are new every morning.', ref: 'Lamentations 3:23' },
  { text: 'Let your light shine before others.', ref: 'Matthew 5:16' },
  { text: 'In all things God works for good.', ref: 'Romans 8:28' },
  { text: 'Peace I leave with you.', ref: 'John 14:27' },
  { text: 'He will renew your strength.', ref: 'Isaiah 40:31' },
  { text: 'Give thanks in all circumstances.', ref: '1 Thess. 5:18' },
  { text: 'Draw near to God and he will draw near.', ref: 'James 4:8' },
  { text: 'The Lord is near to the brokenhearted.', ref: 'Psalm 34:18' },
  { text: 'Love one another as I have loved you.', ref: 'John 13:34' },
  { text: 'Do not fear, for I am with you.', ref: 'Isaiah 41:10' },
  { text: 'Seek first the kingdom of God.', ref: 'Matthew 6:33' },
  { text: 'He is faithful and just to forgive us.', ref: '1 John 1:9' },
  { text: 'Delight yourself in the Lord.', ref: 'Psalm 37:4' },
  { text: 'Come to me, all who are weary.', ref: 'Matthew 11:28' },
  { text: 'The Lord will fight for you.', ref: 'Exodus 14:14' },
  { text: 'Rejoice in the Lord always.', ref: 'Philippians 4:4' },
  { text: 'By grace you have been saved.', ref: 'Ephesians 2:8' },
  { text: 'Create in me a clean heart, O God.', ref: 'Psalm 51:10' },
  { text: 'The truth will set you free.', ref: 'John 8:32' },
  { text: 'Be strong and courageous.', ref: 'Joshua 1:9' },
];

function getDailyVerse() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

function getNextSundayService(): { label: string; diffMs: number } {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  let daysUntilSunday = (7 - day) % 7;

  if (day === 0 && (hours < 10 || (hours === 10 && minutes < 30))) {
    daysUntilSunday = 0;
  }
  if (day === 0 && (hours > 10 || (hours === 10 && minutes >= 30))) {
    daysUntilSunday = 7;
  }

  const target = new Date(now);
  target.setDate(target.getDate() + daysUntilSunday);
  target.setHours(10, 30, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const label = daysUntilSunday === 0 ? 'Today at 10:30 AM' : 'Sunday at 10:30 AM';

  return { label, diffMs };
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Starting soon!';

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${String(minutes).padStart(2, '0')}m`);
  parts.push(`${String(seconds).padStart(2, '0')}s`);

  return parts.join(' ');
}

// ── Quick Action Item ──
const QUICK_ACTIONS = [
  { key: 'videos', icon: Play, label: 'Videos', bg: '#D4920A' },
  { key: 'connect', icon: Users, label: 'Connect', bg: '#2563EB' },
  { key: 'location', icon: MapPin, label: 'Location', bg: '#059669' },
  { key: 'events', icon: Calendar, label: 'Events', bg: '#7C3AED' },
] as const;

// ── Video Card ──
interface VideoCardProps {
  title: string;
  duration: string;
  tag: string;
  tagColor: string;
  image: string;
  onPress: () => void;
}

function VideoCard({ title, duration, tag, tagColor, image, onPress }: VideoCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-80"
      style={{
        width: 200,
        backgroundColor: '#fff',
        borderRadius: 18,
        marginRight: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      {/* Image thumbnail with overlay */}
      <View
        style={{
          height: 120,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          overflow: 'hidden',
        }}
      >
        <Image
          source={{ uri: image }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {/* Dark scrim for play button contrast */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.3)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Play size={20} color="#fff" fill="#fff" />
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={{ padding: 12 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: 'OpenSans_700Bold', fontSize: 14, color: '#1A1714' }}
        >
          {title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: '#9ca3af' }}>
            {duration}
          </Text>
          <View
            style={{
              backgroundColor: tagColor + '18',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontFamily: 'OpenSans_600SemiBold', fontSize: 10, color: tagColor }}>
              {tag}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function HomeScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { status, hlsUrl } = useStreamStatus();
  const [countdown, setCountdown] = useState('');
  const [videoError, setVideoError] = useState(false);
  const [serviceLabel, setServiceLabel] = useState('');

  useEffect(() => {
    function tick() {
      const { label, diffMs } = getNextSundayService();
      setServiceLabel(label);
      setCountdown(formatCountdown(diffMs));
    }

    tick();
    const interval = setInterval(tick, 1_000);
    return () => clearInterval(interval);
  }, []);

  const dailyVerse = getDailyVerse();

  const creamBg = isDark ? colors.background : '#FAF8F5';
  const inkColor = isDark ? colors.foreground : '#1A1714';
  const cardBg = isDark ? colors.card : '#FFFFFF';
  const mutedLabel = isDark ? colors.mutedForeground : '#9A9590';

  function handleQuickAction(key: string) {
    switch (key) {
      case 'videos':
        navigation.getParent()?.navigate('More', { screen: 'Watch' });
        break;
      case 'connect':
        navigation.navigate('Connect');
        break;
      case 'location':
        navigation.navigate('Location');
        break;
      case 'events':
        navigation.getParent()?.navigate('Events');
        break;
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: creamBg }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: insets.top + 12,
            paddingBottom: 16,
            backgroundColor: creamBg,
          }}
        >
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: inkColor }}>
            FPC{' '}
            <Text style={{ color: colors.accent }}>Dallas</Text>
          </Text>
          {/* Avatar circle with initials */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDark ? colors.muted : '#EDE8E1',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'OpenSans_700Bold',
                fontSize: 14,
                color: isDark ? colors.foreground : '#6B5E50',
              }}
            >
              FP
            </Text>
          </View>
        </View>

        {/* ── Hero Card ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable
            onPress={
              status?.isLive
                ? () => navigation.getParent()?.navigate('More', { screen: 'Watch' })
                : undefined
            }
            disabled={!status?.isLive}
            className="overflow-hidden active:opacity-90"
            style={{
              borderRadius: 24,
              height: 220,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            {status?.isLive && hlsUrl && !videoError ? (
              <Video
                source={{ uri: hlsUrl }}
                shouldPlay
                isMuted
                resizeMode={ResizeMode.COVER}
                useNativeControls={false}
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                onError={() => setVideoError(true)}
              />
            ) : (
              <LinearGradient
                colors={['#1A1209', '#3D2B0E', '#5C3D15']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
              />
            )}

            {/* Content overlay */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingBottom: 54,
                },
              ]}
            >
              {status?.isLive ? (
                <Text
                  style={{
                    fontFamily: 'OpenSans_700Bold',
                    fontSize: 18,
                    color: '#fff',
                    textAlign: 'center',
                  }}
                >
                  {status.title}
                </Text>
              ) : (
                <>
                  <Text
                    style={{
                      fontFamily: 'OpenSans_600SemiBold',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.6)',
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    Next Service
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'PlayfairDisplay_700Bold',
                      fontSize: 42,
                      color: '#FFFFFF',
                      textAlign: 'center',
                    }}
                  >
                    {countdown}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.55)',
                      marginTop: 4,
                    }}
                  >
                    {serviceLabel}
                  </Text>
                </>
              )}
            </View>

            {/* Bottom row: Watch Live badge + Gold play button */}
            <View
              style={{
                position: 'absolute',
                bottom: 16,
                left: 20,
                right: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Watch Live glass badge */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                {status?.isLive ? (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#22c55e',
                      marginRight: 6,
                    }}
                  />
                ) : (
                  <Radio size={12} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
                )}
                <Text
                  style={{
                    fontFamily: 'OpenSans_600SemiBold',
                    fontSize: 12,
                    color: '#fff',
                  }}
                >
                  {status?.isLive ? 'LIVE NOW' : 'Watch Live'}
                </Text>
              </View>

              {/* Gold play button */}
              <Pressable
                onPress={() => navigation.getParent()?.navigate('More', { screen: 'Watch' })}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#D4920A',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Play size={18} color="#fff" fill="#fff" />
              </Pressable>
            </View>
          </Pressable>
        </View>

        {/* ── Scripture Strip ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark ? colors.foreground : '#1A1714',
            marginHorizontal: 20,
            marginTop: 18,
            borderRadius: 14,
            paddingHorizontal: 18,
            paddingVertical: 14,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontFamily: 'PlayfairDisplay_400Regular_Italic',
              fontSize: 15,
              color: '#e2e8f0',
              marginRight: 12,
            }}
          >
            {dailyVerse.text}
          </Text>
          <Text
            style={{
              fontFamily: 'OpenSans_700Bold',
              fontSize: 11,
              color: '#D4920A',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            {dailyVerse.ref}
          </Text>
        </View>

        {/* ── Quick Actions ── */}
        <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
          <Text
            style={{
              fontFamily: 'OpenSans_700Bold',
              fontSize: 11,
              color: mutedLabel,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            Quick Access
          </Text>

          <View
            style={{
              flexDirection: 'row',
              backgroundColor: cardBg,
              borderRadius: 20,
              paddingVertical: 18,
              paddingHorizontal: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Pressable
                  key={action.key}
                  onPress={() => handleQuickAction(action.key)}
                  className="items-center active:opacity-70"
                  style={{ flex: 1 }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      backgroundColor: action.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Icon size={24} color="#fff" />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'OpenSans_600SemiBold',
                      fontSize: 11,
                      color: inkColor,
                    }}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Prayer Banner ── */}
        <Pressable
          onPress={() => navigation.navigate('PrayerRequest')}
          className="active:opacity-80"
          style={{ marginTop: 24, marginHorizontal: 20 }}
        >
          <LinearGradient
            colors={['#C05C3A', '#A0412A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 18,
              paddingHorizontal: 22,
              paddingVertical: 20,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#A0412A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'PlayfairDisplay_700Bold',
                  fontSize: 18,
                  color: '#fff',
                }}
              >
                Send a Prayer Request
              </Text>
              <Text
                style={{
                  fontFamily: 'OpenSans_400Regular',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.75)',
                  marginTop: 4,
                }}
              >
                Our team prays for you
              </Text>
            </View>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={20} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* ── Recent Videos ── */}
        <View style={{ marginTop: 28 }}>
          <Text
            style={{
              fontFamily: 'OpenSans_700Bold',
              fontSize: 11,
              color: mutedLabel,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 14,
              paddingHorizontal: 20,
            }}
          >
            Recently Uploaded
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {RECENT_SERVICES.map((service) => (
              <VideoCard
                key={service.id}
                title={service.title}
                duration={service.duration}
                tag={service.tag}
                tagColor={service.tagColor}
                image={service.image}
                onPress={() =>
                  navigation.getParent()?.navigate('More', { screen: 'Watch' })
                }
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
