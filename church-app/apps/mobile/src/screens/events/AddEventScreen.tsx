import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import type { EventCategory } from '@church-app/shared';
import { Input, Button } from '../../components/ui';
import { useTheme } from '../../lib/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const CATEGORIES: { label: string; value: EventCategory; color: string }[] = [
  { label: 'Worship', value: 'worship', color: '#9333ea' },
  { label: 'Fellowship', value: 'fellowship', color: '#3b82f6' },
  { label: 'Outreach', value: 'outreach', color: '#22c55e' },
  { label: 'Youth', value: 'youth', color: '#f97316' },
  { label: 'Prayer', value: 'prayer', color: '#6366f1' },
  { label: 'General', value: 'general', color: '#6b7280' },
];

export function AddEventScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('general');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!token) {
      Alert.alert('Sign In Required', 'Please sign in to create events.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an event title.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      Alert.alert('Invalid Date', 'Please enter a date in YYYY-MM-DD format.');
      return;
    }
    if (!time.trim()) {
      Alert.alert('Required', 'Please enter a start time.');
      return;
    }

    // Build ISO startDate from date + time (e.g. "2026-02-22" + "9:00 AM")
    const startDate = buildISODate(date.trim(), time.trim());
    if (!startDate) {
      Alert.alert('Invalid Time', 'Please enter time like "9:00 AM" or "14:00".');
      return;
    }

    const endDate = endTime.trim() ? buildISODate(date.trim(), endTime.trim()) ?? undefined : undefined;

    try {
      setSaving(true);
      await api.createEvent(token, {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate,
        allDay: false,
        location: location.trim() || undefined,
        category,
        status: 'published',
        featured: false,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-5 pt-4">
        <Input
          label="Event Title"
          placeholder="e.g. Sunday Worship"
          value={title}
          onChangeText={setTitle}
        />
        <Input
          label="Date"
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
        />
        <Input
          label="Start Time"
          placeholder="e.g. 9:00 AM"
          value={time}
          onChangeText={setTime}
        />
        <Input
          label="End Time (optional)"
          placeholder="e.g. 10:30 AM"
          value={endTime}
          onChangeText={setEndTime}
        />
        <Input
          label="Location"
          placeholder="e.g. Main Sanctuary"
          value={location}
          onChangeText={setLocation}
        />
        <Input
          label="Description"
          placeholder="Describe the event..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          className="min-h-[100px] py-3"
          style={{ textAlignVertical: 'top' }}
        />

        {/* Category picker */}
        <Text className="font-body-semibold text-sm text-foreground mb-2">
          Category
        </Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              onPress={() => setCategory(c.value)}
              className="flex-row items-center px-3 py-2 rounded-full border"
              style={{
                backgroundColor: category === c.value ? c.color + '20' : 'transparent',
                borderColor: category === c.value ? c.color : colors.border,
              }}
            >
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: c.color }}
              />
              <Text
                className="font-body-bold text-sm"
                style={{ color: category === c.value ? c.color : colors.foreground }}
              >
                {c.label}
              </Text>
              {category === c.value && (
                <Check size={14} color={c.color} style={{ marginLeft: 4 }} />
              )}
            </Pressable>
          ))}
        </View>

        <Button onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#ffffff" /> : 'Create Event'}
        </Button>
      </View>
    </ScrollView>
  );
}

/** Parse a date string + time string into an ISO timestamp */
function buildISODate(dateStr: string, timeStr: string): string | null {
  // Try parsing "9:00 AM" or "14:00" style times
  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);

  let hours: number;
  let minutes: number;

  if (match12) {
    hours = parseInt(match12[1], 10);
    minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  } else if (match24) {
    hours = parseInt(match24[1], 10);
    minutes = parseInt(match24[2], 10);
  } else {
    return null;
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, hours, minutes);
  return date.toISOString();
}
