import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { apiRequest } from '../../services/api';
WebBrowser.maybeCompleteAuthSession();

export default function LinkGoogleScreen({ route, navigation }) {
  const { role ,sdcId } = route?.params || {};

  const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: '456970553309-14fk1ssbbm4po4iqrknss9l6ljulorgq.apps.googleusercontent.com',
  iosClientId: '456970553309-e1vtskth15r0dpa7drnfpch747i64763.apps.googleusercontent.com',
  webClientId: '456970553309-5f21m5egcqm0a5gdlkj80buqvmd363ef.apps.googleusercontent.com',
});

useEffect(() => {
  if (response?.type === 'success') {
    const idToken = response.authentication?.idToken || response.params?.id_token;
    if (idToken) {
      handleLinkGoogle(idToken);
    } else {
      console.log('Google auth completed without an id token');
    }
  }
}, [response]);

const handleLinkGoogle = async (googleToken) => {
  try {
    await apiRequest('/auth/sdc/link-google', {
      method: 'POST',
      body: { token: googleToken },
    });

    handleNext();
  } catch (err) {
    console.error('Link Google error:', err);
    alert(err.message || 'Network error, please try again');
  }
};

  const handleNext = () => {
    if (role === 'owner') {
      navigation.replace('OwnerTabs');
    } else if (role === 'teacher') {
      navigation.replace('TeacherTabs');
    } else if (role === 'admin') {
      navigation.replace('AdminTabs', { userRole: role });
    } else if (role === 'parent') {
      navigation.replace('ParentTabs');
    } else {
      navigation.replace('BatchSelection');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3e59b1', '#3b82f6', '#60a5fa']}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('SDCLogin');
            }
          }}
        >
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.content}>

          {/* Card */}
          <View style={styles.card}>

            <Text style={styles.title}>Link Google Account</Text>
            <Text style={styles.subtitle}>
              Securely continue with your Google account
            </Text>

            {/* Google Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => promptAsync()}
              disabled={!request}
            >
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Skip */}
            <TouchableOpacity onPress={handleNext}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>

          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FF',
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
  backButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',

    shadowColor: '#607cc8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },


  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E40AF',   
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },

  
  googleBtn: {
    backgroundColor: '#4160c5', 
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },

  googleText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

 
  skipText: {
    color: '#1E40AF',
    fontWeight: '600',
    marginTop: 6,
  },
});
