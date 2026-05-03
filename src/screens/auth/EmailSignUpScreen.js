import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.apiUrl;

export default function EmailSignUpScreen({ navigation, route }) {
  const { role, googleToken, isLinking } = route.params || {};

  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 8) return 'At least 8 characters';
    if (!/[A-Z]/.test(password)) return 'At least one capital letter';
    if (!/[0-9]/.test(password)) return 'At least one number';
    if (!/[^a-zA-Z0-9]/.test(password)) return 'At least one special character';
    if (/\s/.test(password)) return 'No spaces allowed';
    return null;
  };

  const handleSignUp = async () => {
    try {
      // Linking mode → only Google linking
      if (isLinking) {
        const res = await fetch(`${API_URL}/auth/link-google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: googleToken }),
        });

        const data = await res.json();

        if (data.success) {
          await SecureStore.setItemAsync('userToken', data.jwt);
          navigation.navigate('BatchSelection');
        } else {
          alert('Google linking failed');
        }
        return;
      }

      // Setup mode → create account
      const passwordError = validatePassword(password);
      if (passwordError) {
        alert(passwordError);
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords don't match");
        return;
      }

      const res = await fetch(`${API_URL}/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          password,
          name,
          role,
          googleToken,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Setup failed');
        return;
      }

      await SecureStore.setItemAsync('userToken', data.jwt);

      navigation.navigate('BatchSelection');

    } catch (err) {
      console.error('Setup error:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2b58ed', '#1e3a8a']}
        style={styles.gradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>
              {isLinking ? 'Link Google Account' : 'Create Account'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isLinking ? 'Connect your Google account' : 'Create your SDC account'}
            </Text>
          </View>

          <View style={styles.formContainer}>

            {!isLinking && (
              <>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="SDC ID"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={studentId}
                    onChangeText={setStudentId}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Lock size={20} color="rgba(255, 255, 255, 0.6)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} color="#fff" /> : <Eye size={20} color="#fff" />}
                  </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                  <Lock size={20} color="rgba(255, 255, 255, 0.6)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={20} color="#fff" /> : <Eye size={20} color="#fff" />}
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>
                {isLinking ? 'Link Google' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('EmailSignIn')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
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
  backButton: {
    marginBottom: 40,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  signUpButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  signUpButtonText: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  signInLink: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
