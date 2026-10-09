import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthSession } from '@/features/member1/auth/session';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/features/member1/auth/users-api';
import { type AuthUser } from '@/features/member1/auth/auth-api';
import { MobileScreenContainer } from '@/features/member1/components/MobileScreenContainer';

export default function UserManagementScreen() {
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

  useFocusEffect(useCallback(() => {
    void loadUsers();
  }, []));

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
    <MobileScreenContainer backgroundColor="#F8F9FA">
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <TouchableOpacity style={styles.bellIcon}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => {
          setEditingUser(null);
          setFormData({ email: '', displayName: '', password: '', role: 'user', isEmailVerified: true });
          setModalVisible(true);
        }}>
          <Ionicons name="add" size={20} color="#FFF" />
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
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingUser ? 'Edit User' : 'Add User'}</Text>

            <TextInput style={styles.input} placeholder="Display Name" value={formData.displayName} onChangeText={(t) => setFormData({...formData, displayName: t})} />
            <TextInput style={styles.input} placeholder="Email" value={formData.email} onChangeText={(t) => setFormData({...formData, email: t})} editable={!editingUser} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} placeholder={editingUser ? "New Password (Optional)" : "Password"} value={formData.password} onChangeText={(t) => setFormData({...formData, password: t})} secureTextEntry />

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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  bellIcon: { padding: 8 },
  controls: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20,
  },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#357960', paddingHorizontal: 16, borderRadius: 8,
    gap: 6,
  },
  addButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  tabs: {
    flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
    marginBottom: 10,
  },
  tab: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#357960' },
  tabText: { fontSize: 14, color: '#666', fontWeight: '500' },
  activeTabText: { color: '#357960', fontWeight: 'bold' },
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  tableHeaderText: { fontSize: 12, color: '#999', fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
  userInfo: { flex: 2, justifyContent: 'center' },
  userName: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#666' },
  statusBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  statusActive: { backgroundColor: '#E8F5E9' },
  statusInactive: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextActive: { color: '#2E7D32' },
  statusTextInactive: { color: '#C62828' },
  moreButton: { padding: 8, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 12, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  modalCancel: { backgroundColor: '#F0F0F0' },
  modalSave: { backgroundColor: '#357960' },
  modalCancelText: { color: '#666', fontWeight: '600' },
  modalSaveText: { color: '#FFF', fontWeight: '600' },
  deleteButton: { marginTop: 24, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFEBEE', borderRadius: 8 },
  deleteButtonText: { color: '#C62828', fontWeight: '600' }
});
