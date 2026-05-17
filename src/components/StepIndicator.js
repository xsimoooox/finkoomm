import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

/**
 * StepIndicator — shows 4-step progress at the top of the register flow
 */
export default function StepIndicator({ currentStep, totalSteps = 4 }) {
  const animations = useRef(
    Array.from({ length: totalSteps }, (_, i) => new Animated.Value(i < currentStep ? 1 : 0))
  ).current;

  useEffect(() => {
    animations.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i < currentStep ? 1 : 0,
        duration: 300,
        delay: i * 60,
        useNativeDriver: false,
      }).start();
    });
  }, [currentStep]);

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const isCompleted = i < currentStep - 1;
        const isActive = i === currentStep - 1;
        const isPending = i >= currentStep;

        const bgColor = animations[i].interpolate({
          inputRange: [0, 1],
          outputRange: [Colors.bgInput, Colors.primary],
        });

        return (
          <React.Fragment key={i}>
            <Animated.View
              style={[
                styles.step,
                isActive && styles.stepActive,
                isCompleted && styles.stepCompleted,
                isPending && styles.stepPending,
              ]}
            >
              {isCompleted && (
                <Animated.Text style={styles.checkmark}>✓</Animated.Text>
              )}
              {isActive && (
                <View style={styles.activeDot} />
              )}
            </Animated.View>
            {i < totalSteps - 1 && (
              <View style={[styles.connector, isCompleted && styles.connectorActive]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  stepCompleted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  stepPending: {
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  checkmark: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
    maxWidth: 40,
  },
  connectorActive: {
    backgroundColor: Colors.primary,
  },
});
