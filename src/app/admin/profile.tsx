import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { clearAuthSession, getAuthSession } from '@/features/member1/auth/session';
import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';
import { Ionicons } from '@expo/vector-icons';

export default function AdminProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    getAuthSession().then(session => {
      if (session) setAdminUser(session.user);
    });
  }, []);

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
    <MobileScreenContainer backgroundColor="#0A0F0D">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Main Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSubtitle}>SYSTEM ADMINISTRATION</Text>
            <TouchableOpacity>
              <Text style={styles.editProfileText}>Edit profile &gt;</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {adminUser?.displayName ? adminUser.displayName.substring(0, 2).toUpperCase() : 'AD'}
              </Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#000" />
              </View>
            </View>
            
            <View style={styles.nameContainer}>
              <Text style={styles.nameText}>{adminUser?.displayName || 'System Admin'}</Text>
              <Text style={styles.usernameText}>{adminUser?.email || '@admin_fittrack'}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#B8F52A" />
                <Text style={styles.roleText}>Super Admin</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              <Text style={styles.statsDot}>•</Text> Active status
            </Text>
            <Text style={styles.mottoText}>Managing system access.</Text>
          </View>
        </View>

        {/* System Overview */}
        <Text style={styles.sectionHeader}>SYSTEM OVERVIEW</Text>
        
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.iconBox}>
              <Ionicons name="people" size={24} color="#B8F52A" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>User Activity</Text>
              <Text style={styles.cardDesc}>Total users managed today</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>12 active sessions</Text>
            <Text style={styles.progressValue}>Normal load</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '40%' }]} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.iconBox}>
              <Ionicons name="server" size={24} color="#B8F52A" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>System Health</Text>
              <Text style={styles.cardDesc}>All services operational</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Database connected</Text>
            <Text style={styles.progressValue}>100% online</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '100%' }]} />
          </View>
        </View>

        {/* Administration */}
        <Text style={styles.sectionHeader}>ADMINISTRATION</Text>

        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.iconBox}>
              <Ionicons name="settings" size={24} color="#B8F52A" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Global Settings</Text>
              <Text style={styles.cardDesc}>Configure app preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} disabled={loading}>
          <View style={styles.cardTopRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FF444420' }]}>
              <Ionicons name="log-out" size={24} color="#FF4444" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, { color: '#FF4444' }]}>Logout</Text>
              <Text style={styles.cardDesc}>Sign out of admin session</Text>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>

      <View style={[styles.nav, { backgroundColor: '#171B19' }]}>
        <NavItem icon="home-outline" label="Home" color="#A0A0A0" />
        <NavItem icon="barbell-outline" label="Workouts" color="#A0A0A0" />
        <TouchableOpacity style={styles.addNavButton} onPress={() => require('expo-router').router.push('/admin/users')}>
          <Ionicons name="people-outline" size={28} color="#152018" />
        </TouchableOpacity>
        <NavItem icon="stats-chart-outline" label="Progress" color="#A0A0A0" />
        <NavItem icon="person" label="Profile" color="#B8F52A" />
      </View>
    </MobileScreenContainer>
  );
}

function NavItem({ icon, label, color, active = false, onPress }: { icon: any; label: string; color: string; active?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.navItem, active && styles.activeNav]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.navText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: '#0A0F0D',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1C2921',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  container: { padding: 20, paddingBottom: 60 },
  
  profileCard: {
    backgroundColor: '#1C2921',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#26342A',
  },
  cardHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  cardSubtitle: { fontSize: 11, fontWeight: '800', color: '#A0A0A0', letterSpacing: 1 },
  editProfileText: { fontSize: 13, fontWeight: '700', color: '#B8F52A' },
  
  profileInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: '#B8F52A',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16, position: 'relative'
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#0A0F0D' },
  verifiedBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: '#B8F52A', borderRadius: 10, padding: 2,
    borderWidth: 2, borderColor: '#1C2921'
  },
  
  nameContainer: { flex: 1 },
  nameText: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  usernameText: { fontSize: 14, color: '#A0A0A0', marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#26342A',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    alignSelf: 'flex-start'
  },
  roleText: { fontSize: 12, fontWeight: '700', color: '#B8F52A', marginLeft: 6 },
  
  divider: { height: 1, backgroundColor: '#26342A', marginBottom: 16 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  statsDot: { color: '#B8F52A', fontSize: 16 },
  mottoText: { fontSize: 13, color: '#A0A0A0' },
  
  sectionHeader: { fontSize: 13, fontWeight: '800', color: '#A0A0A0', letterSpacing: 1, marginBottom: 16, marginTop: 8 },
  
  card: {
    backgroundColor: '#1C2921', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#26342A'
  },
  logoutCard: {
    backgroundColor: '#1C2921', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#FF444440'
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: '#26342A',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#A0A0A0' },
  
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: '#A0A0A0' },
  progressValue: { fontSize: 12, fontWeight: '700', color: '#B8F52A' },
  
  progressBarBg: { height: 6, backgroundColor: '#26342A', borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: '#B8F52A', borderRadius: 3 },
  nav: { minHeight: 72, paddingHorizontal: 8, paddingTop: 7, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopLeftRadius: 22, borderTopRightRadius: 22, position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 12 },
  activeNav: { backgroundColor: 'rgba(184,245,42,0.12)' },
  navText: { fontSize: 10, fontWeight: '600' },
  addNavButton: { width: 50, height: 50, borderRadius: 20, backgroundColor: '#B8F52A', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
});
