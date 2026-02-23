import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Calendar, Heart, Users, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '../../lib/useTheme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICONS: Record<string, typeof Home> = {
  Home,
  Events: Calendar,
  Give: Heart,
  Groups: Users,
  More: MoreHorizontal,
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const centerIndex = 2; // Give is the 3rd tab (index 2)

  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;
  if ((focusedOptions.tabBarStyle as any)?.display === 'none') return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: Math.max(insets.bottom, 12),
        left: 16,
        right: 16,
        height: 64,
        borderRadius: 24,
        backgroundColor: colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
          },
          android: {
            elevation: 8,
          },
        }),
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;
        const isCenter = index === centerIndex;
        const Icon = TAB_ICONS[route.name] ?? Home;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        if (isCenter) {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -28,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...Platform.select({
                    ios: {
                      shadowColor: colors.accent,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 8,
                    },
                    android: {
                      elevation: 10,
                    },
                  }),
                }}
              >
                <Icon size={28} color="#ffffff" />
              </View>
              <Text
                style={{
                  fontFamily: 'OpenSans_600SemiBold',
                  fontSize: 10,
                  marginTop: 2,
                  color: isFocused ? colors.accent : colors.mutedForeground,
                }}
              >
                {label as string}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
            }}
          >
            <Icon
              size={22}
              color={isFocused ? colors.accent : colors.mutedForeground}
            />
            <Text
              style={{
                fontFamily: 'OpenSans_600SemiBold',
                fontSize: 10,
                marginTop: 4,
                color: isFocused ? colors.accent : colors.mutedForeground,
              }}
            >
              {label as string}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
