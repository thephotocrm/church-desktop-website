import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Play, Radio, ArrowLeft, Share2, Bell, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../lib/useTheme';
import { useStreamStatus } from '../../hooks/useStreamStatus';

// ── Palette ──────────────────────────────────────────────────────
const GOLD = '#C9943A';
const GOLD_LIGHT = '#E8B860';
const WARM_GRAY = '#8C8078';

// ── Series filter chips ──────────────────────────────────────────
const SERIES_FILTERS = ['All', 'Sermons', 'Worship', 'Studies', 'Special'];

// ── Video data ───────────────────────────────────────────────────
const PAST_SERVICES = [
  {
    id: '1',
    title: 'Walking in Faith',
    speaker: 'Pastor Johnson',
    date: 'Feb 16',
    duration: '45 min',
    series: 'Faith Series',
    seriesBg: 'rgba(201,148,58,0.1)',
    seriesColor: GOLD,
    gradientColors: ['#2D1B69', '#5B3FAF'] as const,
    featured: true,
  },
  {
    id: '2',
    title: 'The Power of Prayer',
    speaker: 'Pastor Johnson',
    date: 'Feb 9',
    duration: '52 min',
    series: 'Prayer',
    seriesBg: 'rgba(124,58,237,0.1)',
    seriesColor: '#7C3AED',
    gradientColors: ['#0D3B2E', '#16734F'] as const,
    featured: false,
  },
  {
    id: '3',
    title: 'Grace That Transforms',
    speaker: 'Rev. Williams',
    date: 'Feb 2',
    duration: '38 min',
    series: 'Grace',
    seriesBg: 'rgba(5,150,105,0.1)',
    seriesColor: '#059669',
    gradientColors: ['#3B1A0D', '#8B4513'] as const,
    featured: false,
  },
  {
    id: '4',
    title: 'Unity in the Body',
    speaker: 'Pastor Johnson',
    date: 'Jan 26',
    duration: '41 min',
    series: 'Community',
    seriesBg: 'rgba(37,99,235,0.1)',
    seriesColor: '#2563EB',
    gradientColors: ['#1A2940', '#2D5986'] as const,
    featured: false,
  },
  {
    id: '5',
    title: 'Hope Renewed',
    speaker: 'Rev. Williams',
    date: 'Jan 19',
    duration: '36 min',
    series: 'Hope Series',
    seriesBg: 'rgba(219,39,119,0.1)',
    seriesColor: '#DB2777',
    gradientColors: ['#3B0D2E', '#8B1A6B'] as const,
    featured: false,
  },
];

export function WatchScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { status, hlsUrl } = useStreamStatus();
  const insets = useSafeAreaInsets();
  const [videoError, setVideoError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const creamBg = isDark ? colors.background : '#FAF7F2';
  const inkColor = isDark ? colors.foreground : '#1A1714';
  const cardBg = isDark ? colors.card : '#FFFFFF';
  const borderColor = isDark ? colors.border : 'rgba(26,23,20,0.07)';

  const featured = PAST_SERVICES[0];
  const pastVideos = PAST_SERVICES.slice(1);

  return (
    <View style={{ flex: 1, backgroundColor: creamBg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: insets.top + 10,
            paddingBottom: 18,
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            className="active:opacity-70"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: cardBg,
              borderRadius: 100,
              paddingVertical: 7,
              paddingLeft: 10,
              paddingRight: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.07,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <ArrowLeft size={14} color={WARM_GRAY} />
            <Text
              style={{
                fontFamily: 'OpenSans_600SemiBold',
                fontSize: 13,
                color: WARM_GRAY,
                marginLeft: 5,
              }}
            >
              More
            </Text>
          </Pressable>

          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              fontSize: 20,
              color: inkColor,
              letterSpacing: -0.3,
            }}
          >
            Watch
          </Text>

          <Pressable
            className="active:opacity-70"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: cardBg,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.07,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Share2 size={16} color={WARM_GRAY} />
          </Pressable>
        </View>

        {/* ── Live Player / Offline State ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 0 }}>
          <View
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              aspectRatio: 16 / 9,
              backgroundColor: '#0D0A07',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 32,
              elevation: 6,
            }}
          >
            {status?.isLive && hlsUrl && !videoError ? (
              <>
                <Video
                  source={{ uri: hlsUrl }}
                  shouldPlay
                  isMuted={false}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  style={StyleSheet.absoluteFill}
                  onError={() => setVideoError(true)}
                />
                {/* LIVE badge */}
                <View style={{ position: 'absolute', top: 12, left: 14 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#dc2626',
                      borderRadius: 100,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Radio size={10} color="#fff" />
                    <Text
                      style={{
                        fontFamily: 'OpenSans_700Bold',
                        fontSize: 10,
                        color: '#fff',
                        marginLeft: 5,
                      }}
                    >
                      LIVE
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <LinearGradient
                colors={['#1A1209', '#3D2B0E', '#5C3D15']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill]}
              >
                {/* Center play ring */}
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingBottom: 40,
                  }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth: 2,
                      borderColor: 'rgba(201,148,58,0.35)',
                      backgroundColor: 'rgba(201,148,58,0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Play size={22} color={GOLD_LIGHT} style={{ marginLeft: 3 }} />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.35)',
                      marginTop: 12,
                    }}
                  >
                    No live service right now
                  </Text>
                </View>

                {/* Next service ribbon */}
                <LinearGradient
                  colors={['transparent', 'rgba(13,10,7,0.95)']}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 20,
                    paddingBottom: 14,
                    paddingHorizontal: 16,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontFamily: 'OpenSans_700Bold',
                        fontSize: 9,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        color: GOLD,
                        marginBottom: 2,
                      }}
                    >
                      Next Live
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'PlayfairDisplay_700Bold',
                        fontSize: 15,
                        color: '#fff',
                        letterSpacing: -0.3,
                      }}
                    >
                      Sunday · 10:30 AM
                    </Text>
                  </View>
                  <Pressable
                    className="active:opacity-80"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(201,148,58,0.2)',
                      borderWidth: 1,
                      borderColor: 'rgba(201,148,58,0.35)',
                      borderRadius: 100,
                      paddingVertical: 7,
                      paddingHorizontal: 13,
                    }}
                  >
                    <Bell size={12} color={GOLD_LIGHT} style={{ marginRight: 5 }} />
                    <Text
                      style={{
                        fontFamily: 'OpenSans_700Bold',
                        fontSize: 11,
                        color: GOLD_LIGHT,
                      }}
                    >
                      Remind Me
                    </Text>
                  </Pressable>
                </LinearGradient>
              </LinearGradient>
            )}
          </View>
        </View>

        {/* ── Series Filter ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 22, paddingBottom: 16 }}
        >
          {SERIES_FILTERS.map((f) => {
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
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 1,
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

        {/* ── Featured Video ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 22 }}>
          <Pressable className="active:opacity-90">
            <View
              style={{
                borderRadius: 22,
                overflow: 'hidden',
                aspectRatio: 16 / 9,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.14,
                shadowRadius: 24,
                elevation: 5,
              }}
            >
              <LinearGradient
                colors={[featured.gradientColors[0], featured.gradientColors[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Bottom overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(13,10,7,0.2)', 'rgba(13,10,7,0.92)']}
                locations={[0, 0.5, 1]}
                style={[
                  StyleSheet.absoluteFill,
                  { justifyContent: 'flex-end', padding: 18 },
                ]}
              >
                {/* Tag */}
                <View
                  style={{
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: GOLD,
                    borderRadius: 100,
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    marginBottom: 8,
                  }}
                >
                  <Play size={8} color="#1A1714" fill="#1A1714" style={{ marginRight: 4 }} />
                  <Text
                    style={{
                      fontFamily: 'OpenSans_700Bold',
                      fontSize: 10,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: '#1A1714',
                    }}
                  >
                    Latest Sermon
                  </Text>
                </View>

                <Text
                  style={{
                    fontFamily: 'PlayfairDisplay_700Bold',
                    fontSize: 22,
                    color: '#fff',
                    letterSpacing: -0.4,
                    lineHeight: 26,
                    marginBottom: 5,
                  }}
                >
                  {featured.title}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {featured.speaker}
                  </Text>
                  <View
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      marginHorizontal: 6,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {featured.duration}
                  </Text>
                  <View
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      marginHorizontal: 6,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {featured.date}
                  </Text>
                </View>
              </LinearGradient>

              {/* Glass play button */}
              <View
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Play size={18} color="#fff" fill="#fff" />
              </View>
            </View>
          </Pressable>
        </View>

        {/* ── Past Services ── */}
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
            Past Services
          </Text>
          <Pressable className="active:opacity-70">
            <Text
              style={{ fontFamily: 'OpenSans_600SemiBold', fontSize: 12, color: GOLD }}
            >
              See all
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {pastVideos.map((video) => (
            <Pressable
              key={video.id}
              className="active:opacity-80"
              style={{
                backgroundColor: cardBg,
                borderRadius: 18,
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                paddingRight: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              {/* Gradient thumbnail */}
              <View
                style={{
                  width: 80,
                  height: 56,
                  borderRadius: 12,
                  overflow: 'hidden',
                  marginRight: 14,
                }}
              >
                <LinearGradient
                  colors={[video.gradientColors[0], video.gradientColors[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* Play overlay */}
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: 'rgba(0,0,0,0.25)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Play size={10} color="#1A1714" fill="#1A1714" style={{ marginLeft: 1 }} />
                  </View>
                </View>
              </View>

              {/* Info */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: 'OpenSans_700Bold',
                    fontSize: 14,
                    color: inkColor,
                    lineHeight: 18,
                    marginBottom: 3,
                  }}
                >
                  {video.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 11.5,
                      color: WARM_GRAY,
                    }}
                  >
                    {video.speaker}
                  </Text>
                  <View
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: WARM_GRAY,
                      opacity: 0.4,
                      marginHorizontal: 5,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 11.5,
                      color: WARM_GRAY,
                    }}
                  >
                    {video.duration}
                  </Text>
                </View>
                {/* Series tag */}
                <View
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: video.seriesBg,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 100,
                    marginTop: 5,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'OpenSans_700Bold',
                      fontSize: 10,
                      color: video.seriesColor,
                    }}
                  >
                    {video.series}
                  </Text>
                </View>
              </View>

              {/* Duration badge */}
              <View
                style={{
                  backgroundColor: isDark ? colors.muted : '#F0EBE3',
                  borderRadius: 8,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  marginLeft: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'OpenSans_700Bold',
                    fontSize: 11,
                    color: WARM_GRAY,
                  }}
                >
                  {video.duration.split(' ')[0]}m
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
