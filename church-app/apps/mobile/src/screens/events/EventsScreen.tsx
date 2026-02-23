import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, SlidersHorizontal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Event, EventCategory } from '@church-app/shared';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../lib/useTheme';
import { useEvents } from '../../hooks/useEvents';

const ADMIN_ROLES = ['admin', 'group_admin'];

// ── Category styling ─────────────────────────────────────────────
const CATEGORY_COLORS: Record<EventCategory, string> = {
  worship: '#C9943A',
  fellowship: '#3b82f6',
  outreach: '#22c55e',
  youth: '#9333EA',
  prayer: '#6366f1',
  general: '#6b7280',
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  worship: 'Worship',
  fellowship: 'Fellowship',
  outreach: 'Community',
  youth: 'Youth',
  prayer: 'Prayer',
  general: 'General',
};

function getCategoryColor(category: EventCategory | undefined): string {
  return CATEGORY_COLORS[category ?? 'general'] ?? CATEGORY_COLORS.general;
}

// ── Date helpers ─────────────────────────────────────────────────
function toDateKey(isoString: string): string {
  return isoString.slice(0, 10);
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_ABBR = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];
const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(month: number, year: number): number {
  return new Date(year, month, 1).getDay();
}

function generateCalendarWeeks(month: number, year: number): (number | null)[][] {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfWeek(month, year);
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = new Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getDayName(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

// ── Component ────────────────────────────────────────────────────
export function EventsScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const today = new Date();
  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { events, loading, error } = useEvents(currentMonth, currentYear);

  const weeks = generateCalendarWeeks(currentMonth, currentYear);

  // Build date → event colors map
  const eventsByDate = new Map<string, string[]>();
  events.forEach((e) => {
    const dateKey = toDateKey(e.startDate);
    const existing = eventsByDate.get(dateKey) ?? [];
    existing.push(getCategoryColor(e.category));
    eventsByDate.set(dateKey, existing);
  });

  // Sorted events for display
  const monthEvents = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Filter by selected day
  const displayEvents = selectedDay
    ? monthEvents.filter((e) => {
        const d = new Date(e.startDate).getDate();
        return d === selectedDay;
      })
    : monthEvents;

  const goToPrevMonth = () => {
    setSelectedDay(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const isPast = (day: number) => {
    if (currentYear < today.getFullYear()) return true;
    if (currentYear > today.getFullYear()) return false;
    if (currentMonth < today.getMonth()) return true;
    if (currentMonth > today.getMonth()) return false;
    return day < today.getDate();
  };

  const creamBg = isDark ? colors.background : '#FAF7F2';
  const inkColor = isDark ? colors.foreground : '#1A1714';
  const cardBg = isDark ? colors.card : '#FFFFFF';
  const warmGray = isDark ? colors.mutedForeground : '#8C8078';
  const surfaceBg = isDark ? colors.muted : '#F0EBE3';
  const gold = '#C9943A';

  const handleDayPress = (day: number) => {
    setSelectedDay(day === selectedDay ? null : day);
  };

  // Selected day info for the date strip
  const stripDay = selectedDay ?? today.getDate();
  const stripDayName = selectedDay
    ? getDayName(currentYear, currentMonth, selectedDay)
    : 'All Events';

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
            paddingTop: insets.top + 8,
            paddingBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              fontSize: 28,
              color: inkColor,
              letterSpacing: -0.5,
            }}
          >
            Events
          </Text>
          <Pressable
            className="active:opacity-70"
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: cardBg,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <SlidersHorizontal size={16} color={warmGray} />
          </Pressable>
        </View>

        {/* ── Month Nav ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: 'OpenSans_600SemiBold',
              fontSize: 15,
              color: inkColor,
              letterSpacing: 0.2,
            }}
          >
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              onPress={goToPrevMonth}
              hitSlop={12}
              className="active:opacity-70"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: isDark ? colors.border : 'rgba(26,23,20,0.08)',
                backgroundColor: cardBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={14} color={inkColor} />
            </Pressable>
            <Pressable
              onPress={goToNextMonth}
              hitSlop={12}
              className="active:opacity-70"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: isDark ? colors.border : 'rgba(26,23,20,0.08)',
                backgroundColor: cardBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={14} color={inkColor} />
            </Pressable>
          </View>
        </View>

        {/* ── Calendar ── */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 20,
            backgroundColor: cardBg,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          {/* Day initials header */}
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            {DAY_INITIALS.map((letter, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: 'OpenSans_600SemiBold',
                    fontSize: 11,
                    letterSpacing: 0.8,
                    color: warmGray,
                    textTransform: 'uppercase',
                  }}
                >
                  {letter}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'row' }}>
              {week.map((day, di) => {
                const dateKey = day ? formatDateKey(currentYear, currentMonth, day) : '';
                const hasEvent = day ? eventsByDate.has(dateKey) : false;
                const isTodayCell = day !== null && isToday(day);
                const isSelected = day !== null && day === selectedDay && !isTodayCell;

                return (
                  <Pressable
                    key={di}
                    onPress={() => day && handleDayPress(day)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 40,
                    }}
                  >
                    {day !== null ? (
                      <View style={{ alignItems: 'center' }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isTodayCell
                              ? gold
                              : isSelected
                                ? inkColor
                                : 'transparent',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: 'OpenSans_600SemiBold',
                              fontSize: 14,
                              color:
                                isTodayCell || isSelected
                                  ? '#fff'
                                  : isPast(day)
                                    ? isDark ? '#555' : '#C8C0B8'
                                    : inkColor,
                            }}
                          >
                            {day}
                          </Text>
                        </View>
                        {hasEvent && (
                          <View
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: isTodayCell || isSelected ? '#fff' : gold,
                              marginTop: 2,
                            }}
                          />
                        )}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── Selected Date Strip ── */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: isDark ? colors.foreground : '#1A1714',
            borderRadius: 16,
            paddingHorizontal: 18,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                fontSize: 32,
                color: gold,
                lineHeight: 36,
              }}
            >
              {selectedDay ?? '—'}
            </Text>
            <View>
              <Text
                style={{
                  fontFamily: 'OpenSans_600SemiBold',
                  fontSize: 13,
                  color: '#fff',
                }}
              >
                {stripDayName}
              </Text>
              <Text
                style={{
                  fontFamily: 'OpenSans_400Regular',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: 1,
                }}
              >
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>
            </View>
          </View>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 100,
            }}
          >
            <Text
              style={{
                fontFamily: 'OpenSans_400Regular',
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {displayEvents.length} event{displayEvents.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* ── Section Header ── */}
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
              fontFamily: 'OpenSans_600SemiBold',
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: warmGray,
            }}
          >
            {selectedDay ? `${MONTH_ABBR[currentMonth]} ${selectedDay}` : 'This Month'}
          </Text>
          <Pressable className="active:opacity-70">
            <Text
              style={{
                fontFamily: 'OpenSans_600SemiBold',
                fontSize: 12,
                color: gold,
              }}
            >
              See all
            </Text>
          </Pressable>
        </View>

        {/* ── Events List ── */}
        <View style={{ paddingHorizontal: 16 }}>
          {loading ? (
            <ActivityIndicator size="large" color={gold} style={{ paddingVertical: 32 }} />
          ) : error ? (
            <Text
              style={{
                fontFamily: 'OpenSans_400Regular',
                fontSize: 14,
                color: colors.destructive,
                textAlign: 'center',
                paddingVertical: 32,
              }}
            >
              {error}
            </Text>
          ) : displayEvents.length === 0 ? (
            <Text
              style={{
                fontFamily: 'OpenSans_400Regular',
                fontSize: 14,
                color: warmGray,
                textAlign: 'center',
                paddingVertical: 32,
              }}
            >
              {selectedDay ? 'No events on this day' : 'No events this month'}
            </Text>
          ) : (
            displayEvents.map((event) => {
              const catColor = getCategoryColor(event.category);
              const catLabel = CATEGORY_LABELS[event.category] ?? 'General';
              const eventDate = new Date(event.startDate);
              const dayNum = eventDate.getDate();
              const monthAbbr = MONTH_ABBR[eventDate.getMonth()];
              const isFeatured = event.featured;

              return (
                <Pressable
                  key={event.id}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  className="active:opacity-80"
                  style={{ marginBottom: 10 }}
                >
                  {isFeatured ? (
                    <LinearGradient
                      colors={['#1A1209', '#3D2B0E']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 20,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(201,148,58,0.3)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        elevation: 3,
                      }}
                    >
                      <EventCardInner
                        dayNum={dayNum}
                        monthAbbr={monthAbbr}
                        title={event.title}
                        time={event.allDay ? 'All Day' : formatTime(event.startDate)}
                        location={event.location}
                        catColor={catColor}
                        catLabel={catLabel}
                        featured
                        gold={gold}
                        surfaceBg={surfaceBg}
                        inkColor={inkColor}
                        warmGray={warmGray}
                      />
                    </LinearGradient>
                  ) : (
                    <View
                      style={{
                        backgroundColor: cardBg,
                        borderRadius: 20,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 10,
                        elevation: 2,
                      }}
                    >
                      <EventCardInner
                        dayNum={dayNum}
                        monthAbbr={monthAbbr}
                        title={event.title}
                        time={event.allDay ? 'All Day' : formatTime(event.startDate)}
                        location={event.location}
                        catColor={catColor}
                        catLabel={catLabel}
                        featured={false}
                        gold={gold}
                        surfaceBg={surfaceBg}
                        inkColor={inkColor}
                        warmGray={warmGray}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Admin FAB */}
      {isAdmin && (
        <Pressable
          onPress={() => navigation.navigate('AddEvent')}
          style={{
            position: 'absolute',
            right: 20,
            bottom: insets.bottom + 104,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: gold,
            alignItems: 'center',
            justifyContent: 'center',
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              },
              android: { elevation: 8 },
            }),
          }}
          className="active:opacity-80"
        >
          <Plus size={28} color="#ffffff" />
        </Pressable>
      )}
    </View>
  );
}

// ── Event card inner content (shared by featured/normal) ─────────
interface EventCardInnerProps {
  dayNum: number;
  monthAbbr: string;
  title: string;
  time: string;
  location?: string;
  catColor: string;
  catLabel: string;
  featured: boolean;
  gold: string;
  surfaceBg: string;
  inkColor: string;
  warmGray: string;
}

function EventCardInner({
  dayNum,
  monthAbbr,
  title,
  time,
  location,
  catColor,
  catLabel,
  featured,
  gold: goldColor,
  surfaceBg,
  inkColor,
  warmGray,
}: EventCardInnerProps) {
  return (
    <>
      {/* Date pill */}
      <View
        style={{
          minWidth: 48,
          alignItems: 'center',
          backgroundColor: featured ? 'rgba(201,148,58,0.15)' : surfaceBg,
          borderRadius: 14,
          paddingVertical: 8,
          paddingHorizontal: 6,
          marginRight: 14,
        }}
      >
        <Text
          style={{
            fontFamily: 'OpenSans_700Bold',
            fontSize: 9,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: goldColor,
          }}
        >
          {monthAbbr}
        </Text>
        <Text
          style={{
            fontFamily: 'PlayfairDisplay_700Bold',
            fontSize: 22,
            color: featured ? '#fff' : inkColor,
            lineHeight: 26,
          }}
        >
          {dayNum}
        </Text>
      </View>

      {/* Body */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'OpenSans_600SemiBold',
            fontSize: 15,
            color: featured ? '#fff' : inkColor,
            marginBottom: 3,
          }}
        >
          {title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 12,
              color: featured ? 'rgba(255,255,255,0.5)' : warmGray,
            }}
          >
            {time}
          </Text>
          {location ? (
            <>
              <View
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: featured ? 'rgba(255,255,255,0.3)' : warmGray,
                  marginHorizontal: 6,
                  opacity: 0.6,
                }}
              />
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'OpenSans_400Regular',
                  fontSize: 12,
                  color: featured ? 'rgba(255,255,255,0.5)' : warmGray,
                  flex: 1,
                }}
              >
                {location}
              </Text>
            </>
          ) : null}
        </View>
        {/* Category pill */}
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: catColor + '18',
            paddingHorizontal: 9,
            paddingVertical: 3,
            borderRadius: 100,
            marginTop: 6,
          }}
        >
          <Text
            style={{
              fontFamily: 'OpenSans_600SemiBold',
              fontSize: 10,
              letterSpacing: 0.3,
              color: catColor,
            }}
          >
            {catLabel}
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: featured ? 'rgba(255,255,255,0.1)' : surfaceBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
        }}
      >
        <ChevronRight
          size={14}
          color={featured ? 'rgba(255,255,255,0.6)' : warmGray}
        />
      </View>
    </>
  );
}
