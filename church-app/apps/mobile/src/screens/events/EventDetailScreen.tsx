import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Clock, Calendar, Users, CalendarPlus } from 'lucide-react-native';
import type { EventDetail, EventCategory } from '@church-app/shared';
import { useTheme } from '../../lib/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const CATEGORY_COLORS: Record<EventCategory, string> = {
  worship: '#9333ea',
  fellowship: '#3b82f6',
  outreach: '#22c55e',
  youth: '#f97316',
  prayer: '#6366f1',
  general: '#6b7280',
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  worship: 'Worship',
  fellowship: 'Fellowship',
  outreach: 'Outreach',
  youth: 'Youth',
  prayer: 'Prayer',
  general: 'General',
};

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatTimeRange(startDate: string, endDate?: string): string {
  const start = formatTime(startDate);
  if (!endDate) return start;
  return `${start} – ${formatTime(endDate)}`;
}

export function EventDetailScreen({ route }: any) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const eventId: string | undefined = route.params?.eventId;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const data = await api.getEvent(eventId, token);
      setEvent(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [eventId, token]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const isAttending = event?.myRsvp?.status === 'attending';

  const handleRsvp = async () => {
    if (!event || !token) {
      Alert.alert('Sign In Required', 'Please sign in to RSVP for events.');
      return;
    }
    try {
      setRsvpLoading(true);
      if (isAttending) {
        await api.cancelRsvp(token, event.id);
      } else {
        await api.rsvpToEvent(token, event.id, 'attending');
      }
      await fetchEvent();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update RSVP');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    const url = api.getIcalUrl(event.id);
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="font-body text-muted-foreground text-center">
          {error ?? 'Event not found'}
        </Text>
      </View>
    );
  }

  const categoryColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.general;
  const categoryLabel = CATEGORY_LABELS[event.category] ?? 'General';

  return (
    <View className="flex-1 bg-background">
      {/* Color banner */}
      <View className="h-3" style={{ backgroundColor: categoryColor }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-5">
          {/* Category badge */}
          <View className="flex-row mb-3">
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: categoryColor + '20' }}
            >
              <Text className="font-body-bold text-xs" style={{ color: categoryColor }}>
                {categoryLabel}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className="font-heading-bold text-2xl text-foreground">
            {event.title}
          </Text>

          {/* Meta info */}
          <View className="mt-4 gap-3">
            <View className="flex-row items-center gap-3">
              <Calendar size={18} color={categoryColor} />
              <Text className="font-body text-base text-foreground">
                {formatDate(event.startDate)}
              </Text>
            </View>

            {!event.allDay && (
              <View className="flex-row items-center gap-3">
                <Clock size={18} color={categoryColor} />
                <Text className="font-body text-base text-foreground">
                  {formatTimeRange(event.startDate, event.endDate)}
                </Text>
              </View>
            )}

            {event.location && (
              <View className="flex-row items-center gap-3">
                <MapPin size={18} color={categoryColor} />
                <Text className="font-body text-base text-foreground">
                  {event.location}
                </Text>
              </View>
            )}

            <View className="flex-row items-center gap-3">
              <Users size={18} color={categoryColor} />
              <Text className="font-body text-base text-foreground">
                {event.rsvpCount.attending} {event.rsvpCount.attending === 1 ? 'person' : 'people'} attending
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-3 mt-5">
            <Pressable
              onPress={handleRsvp}
              disabled={rsvpLoading}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl active:opacity-80"
              style={{ backgroundColor: isAttending ? '#22c55e' : colors.accent }}
            >
              {rsvpLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="font-body-bold text-base text-white">
                  {isAttending ? 'Attending \u2713' : "I'm Attending"}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleAddToCalendar}
              className="flex-row items-center justify-center px-4 py-3 rounded-xl border border-border active:opacity-80"
            >
              <CalendarPlus size={18} color={colors.foreground} />
              <Text className="font-body-bold text-sm text-foreground ml-2">
                Add to Calendar
              </Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View className="h-px bg-border my-5" />

          {/* Description */}
          {event.description ? (
            <>
              <Text className="font-body-bold text-lg text-foreground mb-2">
                About this event
              </Text>
              <Text className="font-body text-base text-muted-foreground leading-6">
                {event.description}
              </Text>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
