import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps?: number;
}

export function OnboardingProgress({ currentStep, totalSteps = 4 }: OnboardingProgressProps) {
  const t = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        const isFuture = step > currentStep;

        const checkColor = t.isDark ? '#080D0B' : '#FFFFFF';

        return (
          <React.Fragment key={step}>
            <View
              style={[
                styles.circle,
                {
                  backgroundColor: isCompleted ? (t.isDark ? t.primaryLime : t.primaryGreen) : isCurrent ? t.limeDim : t.surfaceElevated,
                  borderColor: isCurrent ? (t.isDark ? t.primaryLime : t.primaryGreen) : isFuture ? t.border : 'transparent',
                  borderWidth: isCurrent || isFuture ? 1.5 : 0,
                },
              ]}>
              {isCompleted && (
                <Ionicons name="checkmark" size={12} color={checkColor} />
              )}
              {isCurrent && (
                <View
                  style={[
                    styles.currentDot,
                    { backgroundColor: t.isDark ? t.primaryLime : t.primaryGreen },
                  ]}
                />
              )}
            </View>
            {step < totalSteps && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: isCompleted ? (t.isDark ? t.primaryLime : t.primaryGreen) : t.border },
                ]}
              />
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
    paddingVertical: 12,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    width: 30,
    height: 2,
    marginHorizontal: 4,
  },
});
