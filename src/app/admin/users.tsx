import { MobileModal } from '@/components/layout/mobile-viewport';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '@/features/exercises/admin-store';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/features/member1/auth/users-api';
import { type AuthUser } from '@/features/member1/auth/auth-api';
import { router } from 'expo-router';

export default function UserManagementScreen() {
  const { token } = useAdmin();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [formData, setFormData] = useState<{ email: string; displayName: string; password: string; role: 'user' | 'admin'; isEmailVerified: boolean }>({ email: '', displayName: '', password: '', role: 'user', isEmailVerified: true });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      if (!token) throw new Error('Please log in again.');
      const response = await fetchUsers(token);
      setUsers(response.users);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    void fetchUsers(token).then(response => { if (active) setUsers(response.users); })
      .catch(error => { if (active) setMessage(error instanceof Error ? error.message : 'Failed to load users'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true); setMessage('');
    try {
      if (!token) throw new Error('Please log in again.');

      if (editingUser) {
        await updateUser(token, editingUser.id, { displayName: formData.displayName, role: formData.role, isEmailVerified: formData.isEmailVerified, ...(formData.password ? { password: formData.password } : {}) });
        setMessage('User updated.');
      } else {
        if (!formData.email || !formData.password) throw new Error('Email and password required');
        await createUser(token, formData);
        setMessage('User created.');
      }
      setModalVisible(false);
      loadUsers();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Action failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (saving) return;
    setSaving(true); setMessage('');
    try {
      await deleteUser(token, id);
      setModalVisible(false); setConfirmDelete(false);
      setMessage('User deleted.'); await loadUsers();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Delete failed'); }
    finally { setSaving(false); }
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
          {item.isEmailVerified ? 'Verified' : 'Unverified'}
        </Text>
      </View>
      <TouchableOpacity accessibilityLabel={`Edit ${item.displayName || item.email || 'user'}`} style={styles.moreButton} onPress={() => {
        setEditingUser(item);
        setFormData({ email: item.email || '', displayName: item.displayName || '', password: '', role: item.role || 'user', isEmailVerified: item.isEmailVerified });
        setConfirmDelete(false); setMessage(''); setModalVisible(true);
      }}>
        <Ionicons name="ellipsis-vertical" size={20} color="#9AA4AC" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0D1214' }}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <TouchableOpacity accessibilityLabel="Refresh users" style={styles.bellIcon} onPress={() => { setMessage(''); void loadUsers(); }} disabled={loading || saving}>
          <Ionicons name="refresh" size={24} color="#E5E7EB" />
        </TouchableOpacity>
      </View>

      {!!message && <Text accessibilityRole="alert" style={{ color: '#DDE2E7', padding: 16 }}>{message}</Text>}
      <TouchableOpacity onPress={() => router.push('/admin/signup')} style={{ paddingHorizontal: 20, paddingBottom: 16 }}><Text style={{ color: '#C7F52D' }}>Create administrator</Text></TouchableOpacity>
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9AA4AC" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholderTextColor="#9AA4AC"
            placeholder="Search users..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => {
          setEditingUser(null);
          setFormData({ email: '', displayName: '', password: '', role: 'user', isEmailVerified: true });
          setConfirmDelete(false); setMessage(''); setModalVisible(true);
        }}>
          <Ionicons name="add" size={20} color="#171D23" />
          <Text style={styles.addButtonText}>Add User</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(['All', 'Active', 'Inactive'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'All' ? 'All Users' : `${tab === 'Active' ? 'Verified' : 'Unverified'} (${users.filter(u => tab === 'Active' ? u.isEmailVerified : !u.isEmailVerified).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Name / Email</Text>
        <Text style={[styles.tableHeaderText, { width: 95 }]}>Status</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          ListEmptyComponent={<Text style={{ color: '#9AA4AC', padding: 20 }}>No users found.</Text>}
          data={filteredUsers}
          style={{ flex: 1 }}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
        />
      )}

      <MobileModal visible={modalVisible} transparent animationType="slide" onRequestClose={() => { if (!saving) setModalVisible(false); }}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{editingUser ? 'Edit User' : 'Add User'}</Text>

            <TextInput style={[styles.input, { color: '#E5E7EB' }]} placeholderTextColor="#9AA4AC" placeholder="Display Name" value={formData.displayName} onChangeText={(t) => setFormData({...formData, displayName: t})} />
            <TextInput style={[styles.input, { color: '#E5E7EB' }]} placeholderTextColor="#9AA4AC" placeholder="Email" value={formData.email} onChangeText={(t) => setFormData({...formData, email: t})} editable={!editingUser} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={[styles.input, { color: '#E5E7EB' }]} placeholderTextColor="#9AA4AC" placeholder={editingUser ? "New Password (Optional)" : "Password"} value={formData.password} onChangeText={(t) => setFormData({...formData, password: t})} secureTextEntry />

            {!!message && <Text accessibilityRole="alert" style={{ color: '#DDE2E7', marginBottom: 12 }}>{message}</Text>}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              {(['user', 'admin'] as const).map(role => <TouchableOpacity key={role} disabled={saving} onPress={() => setFormData({ ...formData, role })}><Text style={{ color: formData.role === role ? '#C7F52D' : '#9AA4AC' }}>{role === 'admin' ? 'Administrator' : 'Member'}</Text></TouchableOpacity>)}
            </View>
            <TouchableOpacity disabled={saving} onPress={() => setFormData({ ...formData, isEmailVerified: !formData.isEmailVerified })}><Text style={{ color: '#DDE2E7' }}>Email verified: {formData.isEmailVerified ? 'Yes' : 'No'}</Text></TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} disabled={saving} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalSave]} disabled={saving} onPress={handleSave}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
            {confirmDelete && editingUser && <View style={{ gap: 12, marginTop: 16 }}><Text style={{ color: '#DDE2E7' }}>Delete this user? This cannot be undone.</Text><TouchableOpacity disabled={saving} onPress={() => { void handleDelete(editingUser.id); }}><Text style={{ color: '#FF7777' }}>Confirm delete</Text></TouchableOpacity><TouchableOpacity disabled={saving} onPress={() => setConfirmDelete(false)}><Text style={{ color: '#DDE2E7' }}>Keep user</Text></TouchableOpacity></View>}
            {editingUser && (
               <TouchableOpacity style={styles.deleteButton} disabled={saving} onPress={() => setConfirmDelete(true)}>
                 <Text style={styles.deleteButtonText}>Delete User</Text>
               </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </MobileModal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#E5E7EB' },
  bellIcon: { padding: 8 },
  controls: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20,
  },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#171D23', borderRadius: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#2A333B',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { color: '#E5E7EB', flex: 1, height: 44, fontSize: 15 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#C7F52D', paddingHorizontal: 16, borderRadius: 8,
    gap: 6,
  },
  addButtonText: { color: '#171D23', fontWeight: '600', fontSize: 15 },
  tabs: {
    flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#2A333B',
    marginBottom: 10,
  },
  tab: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#C7F52D' },
  tabText: { fontSize: 14, color: '#9AA4AC', fontWeight: '500' },
  activeTabText: { color: '#C7F52D', fontWeight: 'bold' },
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#202830',
  },
  tableHeaderText: { fontSize: 12, color: '#9AA4AC', fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#202830',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2A333B',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#9AA4AC' },
  userInfo: { flex: 2, justifyContent: 'center' },
  userName: { fontSize: 14, fontWeight: '600', color: '#E5E7EB', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#9AA4AC' },
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
  modalContent: { width: '90%', maxWidth: 560, maxHeight: '90%', backgroundColor: '#171D23', borderRadius: 12, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#E5E7EB' },
  input: { borderWidth: 1, borderColor: '#2A333B', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  modalCancel: { backgroundColor: '#202830' },
  modalSave: { backgroundColor: '#C7F52D' },
  modalCancelText: { color: '#9AA4AC', fontWeight: '600' },
  modalSaveText: { color: '#171D23', fontWeight: '600' },
  deleteButton: { marginTop: 24, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFEBEE', borderRadius: 8 },
  deleteButtonText: { color: '#C62828', fontWeight: '600' }
});
