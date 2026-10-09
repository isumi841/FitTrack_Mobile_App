/**
 * StatCard – next-level stat tile used on the Progress Dashboard.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useM4Theme } from '../hooks/useM4Theme';

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  emoji?: string;
  accent?: boolean;
}

export function StatCard({ label, value, sub, emoji, accent }: StatCardProps) {
  const c = useM4Theme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? c.tealDim : c.cardBg,
          borderColor: accent ? c.teal : c.cardBdr,
          shadowColor: accent ? c.teal : '#000',
        },
      ]}
    >
      {emoji ? (
        <Text style={styles.emoji}>{emoji}</Text>
      ) : null}
      <Text style={[styles.value, { color: accent ? c.teal : c.text }]}>{value}</Text>
      <Text style={[styles.label, { color: accent ? c.teal : c.muted }]}>{label}</Text>
      <Text style={[styles.sub, { color: c.subtle }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    minWidth: 0,
    gap: 3,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '400',
  },
});
