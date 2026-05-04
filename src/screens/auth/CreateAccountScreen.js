import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';

export default function CreateAccountScreen({ navigation, route }) {
  const role = route?.params?.role || "student";

  const [sdcId, setSdcId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (pass) => {
    const hasMinLength = pass.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    return hasMinLength && hasLetter && hasNumber;
  };

  const handleContinue = () => {
    if (!sdcId || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (!validatePassword(password)) {
    alert("Password must be at least 6 characters and include both letters and numbers");
    return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    navigation.replace("LinkGoogle", {
      sdcId,
      password,
      role,
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2b58ed', '#2b58ed']} style={styles.gradient} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>

          <View style={styles.card}>

            <View style={styles.logoBox}>
              <Text style={styles.logoText}>SDC</Text>
            </View>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your journey with SDC</Text>

            <TextInput
              placeholder="SDC ID"
              placeholderTextColor="#94A3B8"
              value={sdcId}
              onChangeText={setSdcId}
              style={styles.input}
            />

            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />

              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#1E40AF" />
                ) : (
                  <Eye size={20} color="#1E40AF" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
              />

              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#1E40AF" />
                ) : (
                  <Eye size={20} color="#1E40AF" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginBold}>Sign in</Text>
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
    backgroundColor: '#EAF2FF',
  },

  gradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  safeArea: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    padding: 25,

    shadowColor: '#4465c2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },

  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },

  logoText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 25,
  },

  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },

  input: {
    backgroundColor: '#F1F5FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    color: '#3859a5',
    borderWidth: 1,
    borderColor: '#D6E4FF',
    paddingRight: 45,
  },

  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },

  button: {
    backgroundColor: '#1E40AF',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  loginText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
  },

  loginBold: {
    color: '#4463c7',
    fontWeight: 'bold',
  },
});