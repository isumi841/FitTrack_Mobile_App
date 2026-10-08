import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { adminSignup, login } from '@/features/member1/auth/auth-api';
import { saveAuthSession } from '@/features/member1/auth/session';
import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';

export default function AdminSignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      setLoading(true);
      const response = await adminSignup({ email, password });
      await saveAuthSession(response);
      Alert.alert('Success', 'Admin account created successfully!');
      router.replace('/admin/users');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      setLoading(true);
      // Using the regular login or we can use adminLogin if preferred
      const response = await login({ email, password }); 
      if (response.user.role !== 'admin') {
        throw new Error('Not an admin account');
      }
      await saveAuthSession(response);
      Alert.alert('Success', 'Logged in as Admin');
      router.replace('/admin/users');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileScreenContainer backgroundColor="#F8F9FA">
      <View style={styles.container}>
        <Text style={styles.title}>Admin Portal</Text>
        <Text style={styles.subtitle}>Sign in or create an admin account to manage the platform.</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Admin Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Admin Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Please wait...' : 'Login as Admin'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignup} disabled={loading}>
          <Text style={styles.secondaryButtonText}>Create New Admin</Text>
        </TouchableOpacity>
      </View>
    </MobileScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#357960',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#357960',
  },
  secondaryButtonText: {
    color: '#357960',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
