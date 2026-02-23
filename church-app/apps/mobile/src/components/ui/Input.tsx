import React from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  containerClassName = '',
  className = '',
  ...props
}: InputProps) {
  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="font-body-semibold text-sm text-foreground mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        className={`bg-card border rounded-lg px-4 py-3.5 font-body text-base text-foreground ${
          error ? 'border-destructive' : 'border-border'
        } ${className}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && (
        <Text className="font-body text-sm text-destructive mt-1">{error}</Text>
      )}
    </View>
  );
}
