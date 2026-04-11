import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
const API_URL = 'https://sdcapp-backend-456970553309.asia-south1.run.app';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';

export default function ChangePasswordScreen({ navigation }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? (
                  <EyeOff size={20} color="#fff" />
                ) : (
                  <Eye size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="rgba(255,255,255,0.6)"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#fff" />
                ) : (
                  <Eye size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSubmit}
            >
              <Text style={styles.signInButtonText}>Update Password</Text>
            </TouchableOpacity>

          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}