import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
const API_URL = 'https://sdcapp-backend-456970553309.asia-south1.run.app';
export default function ChangePasswordScreen({ navigation }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

   if (!newPassword || newPassword.length < 6) {
    return alert('Password must be at least 6 characters');
  }

  try {
    const token = await SecureStore.getItemAsync('userToken');
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newPassword })
    });
    console.log('Fetching:', `${API_URL}/auth/change-password`);
    const data = await res.json();

    if (res.status === 200) {
      alert('Password changed successfully!');
      navigation.navigate('BatchSelection');
    } else {
      alert(data.error || 'Failed to change password');
    }
  } catch (err) {
    alert('Something went wrong. Please try again.');
    console.log('Change password error:', err);
  }
};
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Change Password</Text>

        <Text style={styles.subtitle}>
          You are using a temporary password. Please set a new password to continue.
        </Text>

        <TextInput
          placeholder="New Password"
          secureTextEntry
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2b58ed',
    padding: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
