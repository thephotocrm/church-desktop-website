import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useStreamStatus } from '../../hooks/useStreamStatus';

export function LivestreamScreen() {
  const { status, loading, error, hlsUrl, refetch } = useStreamStatus();
  const [videoError, setVideoError] = useState(false);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Unable to check stream status</Text>
        <Pressable style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (status?.isLive && hlsUrl && !videoError) {
    return (
      <View style={styles.container}>
        <View style={styles.playerWrapper}>
          <Video
            source={{ uri: hlsUrl }}
            shouldPlay
            isMuted={false}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            style={styles.video}
            onError={() => setVideoError(true)}
          />
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{status.title}</Text>
          {status.description ? (
            <Text style={styles.description}>{status.description}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  // Offline / not streaming
  return (
    <View style={styles.offlineContainer}>
      <Text style={styles.offlineIcon}>📡</Text>
      <Text style={styles.offlineTitle}>Live Stream Starting Soon</Text>
      <Text style={styles.offlineSubtitle}>Join us Sundays at 10:00 AM CST</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  playerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  info: {
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 32,
  },
  offlineIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  offlineTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  offlineSubtitle: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#9ca3af',
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
