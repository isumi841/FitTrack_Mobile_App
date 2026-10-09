import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuthSession } from '@/features/member1/auth/session';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/features/member1/auth/users-api';
import { type AuthUser } from '@/features/member1/auth/auth-api';
import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';

export default function UserManagementScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [formData, setFormData] = useState({ email: '', displayName: '', password: '', role: 'user', isEmailVerified: true });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const session = await getAuthSession();
      if (!session) throw new Error('Not logged in');
      const response = await fetchUsers(session.session.accessToken);
      setUsers(response.users);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSave = async () => {
    try {
      const session = await getAuthSession();
      if (!session) throw new Error('Not logged in');
      
      if (editingUser) {
        await updateUser(session.session.accessToken, editingUser.id, formData);
        Alert.alert('Success', 'User updated');
      } else {
        if (!formData.email || !formData.password) throw new Error('Email and password required');
        await createUser(session.session.accessToken, formData);
        Alert.alert('Success', 'User created');
      }
      setModalVisible(false);
      loadUsers();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete User', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const session = await getAuthSession();
          if (!session) throw new Error('Not logged in');
          await deleteUser(session.session.accessToken, id);
          loadUsers();
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Delete failed');
        }
      }}
    ]);
  };

  const filteredUsers = users.filter(u => {
    if (activeTab === 'Active' && !u.isEmailVerified) return false;
    if (activeTab === 'Inactive' && u.isEmailVerified) return false;
    if (search && !u.email?.toLowerCase().includes(search.toLowerCase()) && !u.displayName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const renderUser = ({ item }: { item: AuthUser }) => (
    <View style={styles.userCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.displayName ? item.displayName.charAt(0).toUpperCase() : 'U'}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName || 'Unknown'}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={[styles.statusBadge, item.isEmailVerified ? styles.statusActive : styles.statusInactive]}>
        <Text style={[styles.statusText, item.isEmailVerified ? styles.statusTextActive : styles.statusTextInactive]}>
          {item.isEmailVerified ? 'Active' : 'Inactive'}
        </Text>
      </View>
      <TouchableOpacity style={styles.moreButton} onPress={() => {
        setEditingUser(item);
        setFormData({ email: item.email || '', displayName: item.displayName || '', password: '', role: item.role || 'user', isEmailVerified: item.isEmailVerified });
        setModalVisible(true);
      }}>
        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  return (
    <MobileScreenContainer backgroundColor="#0A0F0D">
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity style={styles.bellIcon} onPress={() => router.push('/admin/profile')}>
          <Ionicons name="settings-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#A0A0A0"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => {
          setEditingUser(null);
          setFormData({ email: '', displayName: '', password: '', role: 'user', isEmailVerified: true });
          setModalVisible(true);
        }}>
          <Ionicons name="add" size={20} color="#152018" />
          <Text style={styles.addButtonText}>Add User</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {['All', 'Active', 'Inactive'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab as any)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'All' ? 'All Users' : `${tab} (${users.filter(u => tab === 'Active' ? u.isEmailVerified : !u.isEmailVerified).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Email</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#B8F52A" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item: any) => item.id || item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={[styles.nav, { backgroundColor: '#171B19' }]}>
        <NavItem icon="home-outline" label="Home" color="#A0A0A0" />
        <NavItem icon="barbell-outline" label="Workouts" color="#A0A0A0" />
        <TouchableOpacity style={styles.addNavButton} onPress={() => {
          setEditingUser(null);
          setFormData({ email: '', displayName: '', password: '', role: 'user', isEmailVerified: true });
          setModalVisible(true);
        }}>
          <Ionicons name="add" size={28} color="#152018" />
        </TouchableOpacity>
        <NavItem icon="stats-chart-outline" label="Progress" color="#A0A0A0" />
        <NavItem icon="person" label="Profile" color="#A0A0A0" onPress={() => router.push('/admin/profile')} />
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingUser ? 'Edit User' : 'Add User'}</Text>
            
            <TextInput style={styles.input} placeholderTextColor="#666" placeholder="Display Name" value={formData.displayName} onChangeText={(t) => setFormData({...formData, displayName: t})} />
            <TextInput style={styles.input} placeholderTextColor="#666" placeholder="Email" value={formData.email} onChangeText={(t) => setFormData({...formData, email: t})} editable={!editingUser} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} placeholderTextColor="#666" placeholder={editingUser ? "New Password (Optional)" : "Password"} value={formData.password} onChangeText={(t) => setFormData({...formData, password: t})} secureTextEntry />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalSave]} onPress={handleSave}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
            {editingUser && (
               <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(editingUser.id)}>
                 <Text style={styles.deleteButtonText}>Delete User</Text>
               </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  bellIcon: { padding: 8 },
  controls: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20,
  },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C2921', borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#26342A',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 15, color: '#FFF' },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#B8F52A', paddingHorizontal: 16, borderRadius: 12,
    gap: 6,
  },
  addButtonText: { color: '#152018', fontWeight: '700', fontSize: 15 },
  tabs: {
    flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#26342A',
    marginBottom: 10,
  },
  tab: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#B8F52A' },
  tabText: { fontSize: 14, color: '#A0A0A0', fontWeight: '600' },
  activeTabText: { color: '#B8F52A', fontWeight: '800' },
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#26342A',
  },
  tableHeaderText: { fontSize: 12, color: '#A0A0A0', fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#26342A',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#26342A',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#B8F52A' },
  userInfo: { flex: 2, justifyContent: 'center' },
  userName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  userEmail: { fontSize: 13, color: '#A0A0A0' },
  statusBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  statusActive: { backgroundColor: 'rgba(184, 245, 42, 0.15)' },
  statusInactive: { backgroundColor: 'rgba(255, 68, 68, 0.15)' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextActive: { color: '#B8F52A' },
  statusTextInactive: { color: '#FF4444' },
  moreButton: { padding: 8, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#152018', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#26342A' },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20, color: '#FFF' },
  input: { borderWidth: 1, borderColor: '#26342A', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 15, color: '#FFF', backgroundColor: '#1C2921' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  modalCancel: { backgroundColor: '#26342A' },
  modalSave: { backgroundColor: '#B8F52A' },
  modalCancelText: { color: '#FFF', fontWeight: '700' },
  modalSaveText: { color: '#152018', fontWeight: '800' },
  deleteButton: { marginTop: 24, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255, 68, 68, 0.1)' },
  deleteButtonText: { color: '#FF4444', fontWeight: '700' },
  nav: { minHeight: 72, paddingHorizontal: 8, paddingTop: 7, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopLeftRadius: 22, borderTopRightRadius: 22, position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 12 },
  activeNav: { backgroundColor: 'rgba(184,245,42,0.12)' },
  navText: { fontSize: 10, fontWeight: '600' },
  addNavButton: { width: 50, height: 50, borderRadius: 20, backgroundColor: '#B8F52A', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
});
