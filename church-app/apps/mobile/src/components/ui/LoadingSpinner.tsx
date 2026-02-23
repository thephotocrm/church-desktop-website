import React from 'react';
import { View, ActivityIndicator } from 'react-native';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({ className = '', size = 'large' }: LoadingSpinnerProps) {
  return (
    <View className={`flex-1 items-center justify-center bg-background ${className}`}>
      <ActivityIndicator size={size} color="#e7b008" />
    </View>
  );
}
