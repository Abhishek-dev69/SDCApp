import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, Mail } from 'lucide-react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import Constants from 'expo-constants';




const API_URL = Constants.expoConfig.extra.apiUrl;

console.log(AuthSession.makeRedirectUri({ useProxy: true })); // For debugging redirect URI issues
WebBrowser.maybeCompleteAuthSession();

GoogleSignin.configure({
  webClientId: '456970553309-5f21m5egcqm0a5gdlkj80buqvmd363ef.apps.googleusercontent.com',
});

export default function LoginScreen({ navigation, route }) {
  const { role } = route.params || {};
  // // Google auth setup
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   androidClientId: '456970553309-14fk1ssbbm4po4iqrknss9l6ljulorgq.apps.googleusercontent.com',
  //   iosClientId: '456970553309-e1vtskth15r0dpa7drnfpch747i64763.apps.googleusercontent.com',
  //   webClientId: '456970553309-5f21m5egcqm0a5gdlkj80buqvmd363ef.apps.googleusercontent.com',
  // });

  // Runs automatically when Google responds
  // useEffect(() => {
  //   if (response?.type === 'success') {
  //     handleGoogleToken(response.authentication.idToken);
  //   }
  // }, [response]);

  // const handleGoogleToken = async (googleToken) => {
    const handleGoogleSignIn = async () => {
    try {await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      console.log('Response type:', response?.type);
      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        const user = response.data.user;
        
        console.log('idToken:', idToken ? 'exists' : 'MISSING');
        console.log('User:', user.name, user.email);
        console.log('Calling backend at:', API_URL);
        const res = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken })
        });
        
        console.log('Backend response status:', res.status);
        const data = await res.json();
        console.log('JWT received:', data.jwt ? 'yes' : 'no');
        
        if (data.jwt) {
          await SecureStore.setItemAsync('userToken', data.jwt);
          navigation.navigate('BatchSelection');
        } else {
          console.log('No JWT received, backend error:', data.error);
        }
      }
    } catch (err) {
      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.IN_PROGRESS:
            console.log('Google Sign-In already in progress');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log('Google Play Services not available');
            break;
          default:
            console.log('Google Sign-In error:', err);
      }
      
      }
      else {
        console.log('Unexpected error during Google Sign-In:', err);
      } 

    }
  };

  const handleEmailPress = () => {
    navigation.navigate('EmailSignIn', { role });
  };

  const handlePhonePress = () => {
    navigation.navigate('PhoneLogin', { role });
  };



  const handleLogin = () => {
    if (role === 'admin') {
      navigation.navigate('AdminTabs');
    } else if (role === 'parent') {
      navigation.navigate('ParentTabs');
    } else {
      navigation.navigate('BatchSelection');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2b58ed', '#1e3a8a']}
        style={styles.gradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>SDC</Text>
            </View>
          </View>

          {/* Header Section */}
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitleText}>Sign in to continue learning</Text>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.buttonSection}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleSignIn} 
            >
              <View style={styles.iconWrapper}>
                {/* Mocking Google G with colored segments or an image if available */}
                <Image 
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png' }} 
                  style={styles.googleIcon}
                />
              </View>
              <Text style={styles.buttonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handlePhonePress}
            >
              <View style={styles.iconWrapper}>
                <Phone size={24} color="#10b981" fill="#10b981" />
              </View>
              <Text style={styles.buttonText}>Continue with Phone Number</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleEmailPress}
            >
              <View style={styles.iconWrapper}>
                <Mail size={24} color="#2b58ed" fill="#2b58ed" />
              </View>
              <Text style={styles.buttonText}>Continue with Email</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
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
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginTop: 40,
    marginBottom: 30,
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  welcomeText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  buttonSection: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50, // Capsule shape
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconWrapper: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    textAlign: 'center',
    marginRight: 32, // Offset the icon width to center text
  },
  footerContainer: {
    marginTop: 'auto',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  signUpLink: {
    color: '#ffffff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
