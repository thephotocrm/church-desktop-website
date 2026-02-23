import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent active:bg-accent/80',
  secondary: 'bg-primary active:bg-primary/80',
  outline: 'border border-border bg-transparent active:bg-muted',
  ghost: 'bg-transparent active:bg-muted',
  destructive: 'bg-destructive active:bg-destructive/80',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-accent-foreground font-body-bold',
  secondary: 'text-primary-foreground font-body-bold',
  outline: 'text-foreground font-body-semibold',
  ghost: 'text-foreground font-body-semibold',
  destructive: 'text-white font-body-bold',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 rounded-lg',
  md: 'px-6 py-3.5 rounded-xl',
  lg: 'px-8 py-4 rounded-xl',
};

const sizeTextClasses: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  textClassName = '',
  icon,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#6b7280' : '#fff'}
        />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`${variantTextClasses[variant]} ${sizeTextClasses[size]} ${textClassName}`}>
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}
