import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { clearAuthSession } from '@/features/member1/auth/session';
import { MobileScreenContainer } from '@/features/member1/components/MobileScreenContainer';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout from Admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try {
          setLoading(true);
          await clearAuthSession();
          router.replace('/admin/signup');
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Logout failed');
        } finally {
          setLoading(false);
        }
      }}
    ]);
  };

  return (
    <MobileScreenContainer backgroundColor="#F8F9FA">
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.settingText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout} disabled={loading}>
            <Ionicons name="log-out-outline" size={24} color="#C62828" />
            <Text style={[styles.settingText, { color: '#C62828' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </MobileScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  container: { flex: 1, padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', padding: 16, borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  settingText: { flex: 1, fontSize: 16, color: '#333', marginLeft: 12, fontWeight: '500' },
  chevron: { marginLeft: 'auto' },
});
