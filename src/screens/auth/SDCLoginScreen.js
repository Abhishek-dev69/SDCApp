import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';

export default function SDCLoginScreen({ navigation }) {
  const [sdcId, setSdcId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!sdcId || !password) {
      alert("Please enter SDC ID and Password");
      return;
    }

    navigation.replace('BatchSelection');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#3e59b1', '#3e59b1']} style={styles.gradient} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>

          <View style={styles.card}>

            <View style={styles.logoBox}>
              <Text style={styles.logoText}>SDC</Text>
            </View>

            <Text style={styles.title}>SDC Login</Text>
            <Text style={styles.subtitle}>Enter your credentials to continue</Text>

            {/* SDC ID */}
            <TextInput
              placeholder="Enter SDC ID"
              placeholderTextColor="#64748B"
              value={sdcId}
              onChangeText={setSdcId}
              style={styles.input}
            />

            {/* PASSWORD WITH EYE ICON */}
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Enter Password"
                placeholderTextColor="#64748B"
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

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>

            
            <TouchableOpacity onPress={() => navigation.navigate("CreateAccount")}>
              <Text style={styles.bottomText}>
                New here? <Text style={styles.bold}>Create Account</Text>
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
    borderRadius: 24,
    padding: 24,
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
    marginBottom: 20,
  },

  input: {
    backgroundColor: '#F1F5FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    color: '#000',   // ✅ FIXED BLACK TEXT
  },

  inputWrapper: {
    position: 'relative',
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
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  bottomText: {
    textAlign: 'center',
    marginTop: 15,
    color: '#64748B',
  },

  bold: {
    color: '#1E40AF',
    fontWeight: 'bold',
  },
});