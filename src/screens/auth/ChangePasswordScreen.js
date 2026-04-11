import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
const API_URL = 'https://sdcapp-backend-456970553309.asia-south1.run.app';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
export default function ChangePasswordScreen({ navigation }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
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
      <LinearGradient
        colors={['#2b58ed', '#1e3a8a']}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.scrollContent}>

          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Change Password</Text>
            <Text style={styles.headerSubtitle}>
              Set a new password to continue
            </Text>
          </View>

          <View style={styles.formContainer}>

            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="New Password"
                placeholderTextColor="rgba(255,255,255,0.6)"
                secureTextEntry
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="rgba(255,255,255,0.6)"
                secureTextEntry
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.signInButton,
                loading && { opacity: 0.6 }
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.signInButtonText}>
                {loading ? 'Updating...' : 'Update Password'}
              </Text>
            </TouchableOpacity>

          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  formContainer: {
    gap: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  signInButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  signInButtonText: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: 'bold',
  },
});