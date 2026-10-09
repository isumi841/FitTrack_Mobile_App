import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeMode, useTheme } from '@/features/member1/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ThemeToggleProps {
  style?: object;
  showLabel?: boolean;
}

const THEME_OPTIONS: {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export function ThemeToggle({ style, showLabel = false }: ThemeToggleProps) {
  const t = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedLabel = THEME_OPTIONS.find((option) => option.mode === t.themeMode)?.label ?? 'System';
  const triggerIcon: keyof typeof Ionicons.glyphMap = t.themeMode === 'system'
    ? 'phone-portrait-outline'
    : t.isDark
      ? 'moon'
      : 'sunny';

  const selectThemeMode = (mode: ThemeMode) => {
    t.setThemeMode(mode);
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Choose theme mode. Current setting: ${selectedLabel}`}
        style={({ pressed }) => [
          styles.toggleBtn,
          {
            width: showLabel ? undefined : 36,
            paddingHorizontal: showLabel ? 11 : 0,
            backgroundColor: t.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
            borderColor: t.border,
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
          style,
        ]}
        hitSlop={8}>
        <Ionicons name={triggerIcon} size={16} color={t.isDark ? t.primaryLime : t.secondaryTeal} />
        {showLabel && <Text style={[styles.label, { color: t.textPrimary }]}>{selectedLabel}</Text>}
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close theme selector"
            style={StyleSheet.absoluteFill}
            onPress={() => setIsOpen(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Appearance</Text>
            <Text style={[styles.modalSubtitle, { color: t.textSecondary }]}>Choose how FitTrack looks</Text>

            <View style={styles.options}>
              {THEME_OPTIONS.map((option) => {
                const isSelected = t.themeMode === option.mode;

                return (
                  <Pressable
                    key={option.mode}
                    onPress={() => selectThemeMode(option.mode)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: isSelected ? t.limeDim : t.surfaceElevated,
                        borderColor: isSelected ? (t.isDark ? t.primaryLime : t.primaryGreen) : t.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}>
                    <View style={[styles.optionIcon, { backgroundColor: isSelected ? t.greenDim : t.surface }]}>
                      <Ionicons
                        name={option.icon}
                        size={18}
                        color={isSelected ? (t.isDark ? t.primaryLime : t.primaryGreen) : t.textSecondary}
                      />
                    </View>
                    <View style={styles.optionCopy}>
                      <Text style={[styles.optionLabel, { color: t.textPrimary }]}>{option.label}</Text>
                      <Text style={[styles.optionDescription, { color: t.textMuted }]}>
                        {option.mode === 'system' ? 'Match your device' : `Always use ${option.label.toLowerCase()} mode`}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={t.isDark ? t.primaryLime : t.primaryGreen} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toggleBtn: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
      },
    }),
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 18,
  },
  options: { gap: 10 },
  option: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionCopy: { flex: 1 },
  optionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  optionDescription: { fontSize: 11.5 },
});
