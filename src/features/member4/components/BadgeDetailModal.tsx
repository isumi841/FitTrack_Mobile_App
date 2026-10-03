/**
 * BadgeDetailModal – full-screen modal showing achievement detail.
 * Uses React Native Modal with dark translucent backdrop.
 */
import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { Achievement } from '../types';
import { useM4Theme } from '../hooks/useM4Theme';

interface BadgeDetailModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

export function BadgeDetailModal({
  visible,
  achievement,
  onClose,
}: BadgeDetailModalProps) {
  const c = useM4Theme();

  if (!achievement) return null;

  async function handleShare() {
    try {
      await Share.share({
        message: `🏆 I just earned the "${achievement!.title}" badge on FitTrack!\n\n${achievement!.description}`,
        title: 'FitTrack Achievement',
      });
    } catch {
      Alert.alert('Share failed', 'Could not open share sheet.');
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: c.overlay }]} />
      </TouchableWithoutFeedback>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.center}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: c.bg2,
                borderColor: c.borderH,
                shadowColor: c.teal,
              },
            ]}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: c.tealDim, borderColor: c.teal },
              ]}
            >
              <Text style={styles.icon}>{achievement.icon}</Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: c.teal }]}>{achievement.title}</Text>

            {/* Description */}
            <Text style={[styles.desc, { color: c.muted }]}>
              {achievement.description}
            </Text>

            {/* Earned on */}
            {achievement.earnedOn && (
              <View style={[styles.earnedRow, { borderColor: c.border }]}>
                <Text style={[styles.earnedLabel, { color: c.subtle }]}>Earned on</Text>
                <Text style={[styles.earnedDate, { color: c.text }]}>
                  {achievement.earnedOn}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.shareBtn,
                  {
                    backgroundColor: pressed ? c.tealDim : c.teal,
                    shadowColor: c.teal,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Share this achievement"
              >
                <Text style={styles.shareBtnText}>Share 🔗</Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    backgroundColor: pressed ? c.tealDim : c.surface,
                    borderColor: c.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={[styles.closeBtnText, { color: c.muted }]}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  earnedRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    paddingTop: 14,
    alignItems: 'center',
    gap: 4,
  },
  earnedLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  earnedDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  shareBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
