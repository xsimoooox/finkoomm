import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary', // 'primary' | 'outline' | 'ghost'
  size = 'large',       // 'large' | 'medium' | 'small'
  icon,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const isDisabled = disabled || loading;

  const heights = { large: 56, medium: 46, small: 38 };
  const fontSizes = { large: 16, medium: 14, small: 13 };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, isDisabled && styles.disabledWrapper]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
        style={[
          styles.base,
          variant === 'outline' && styles.outline,
          variant === 'ghost' && styles.ghost,
          { height: heights[size] },
        ]}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={isDisabled ? ['#2A3550', '#1E2940'] : Colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, styles.gradient]}
          />
        ) : null}

        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? Colors.textOnPrimary : Colors.primary}
            size="small"
          />
        ) : (
          <>
            {icon && <Text style={{ marginRight: 8 }}>{icon}</Text>}
            <Text
              style={[
                styles.text,
                { fontSize: fontSizes[size] },
                variant === 'outline' && styles.textOutline,
                variant === 'ghost' && styles.textGhost,
                isDisabled && styles.textDisabled,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  disabledWrapper: { opacity: 0.6 },
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    paddingHorizontal: 24,
  },
  gradient: {
    borderRadius: 16,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  text: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textOutline: {
    color: Colors.primary,
  },
  textGhost: {
    color: Colors.textSecondary,
  },
  textDisabled: {
    color: Colors.textMuted,
  },
});
