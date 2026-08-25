import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { apiRequest, getAuthToken, fetchAndStoreProfile } from '../../services/api';
import { useUserSession } from '../../context/UserSessionContext';
WebBrowser.maybeCompleteAuthSession();

export default function LinkGoogleScreen({ route, navigation }) {
  const { role: routeRole, sdcId } = route?.params || {};
  const { userProfile, setUserProfile } = useUserSession();
  const [resolving, setResolving] = useState(false);

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

    await handleNext();
  } catch (err) {
    console.error('Link Google error:', err);
    alert(err.message || 'Network error, please try again');
  }
};

  // Routes to the right dashboard for a given role. Normalizes casing/whitespace
  // so a value like "Teacher" or " teacher " still matches. Returns true if it
  // recognized the role and navigated, false otherwise (so callers can fall back
  // instead of silently landing on the wrong screen).
  const routeForRole = (role, batchId) => {
    const normalizedRole = String(role || '').trim().toLowerCase();
    switch (normalizedRole) {
      case 'owner':
        navigation.replace('OwnerTabs');
        return true;
      case 'teacher':
        navigation.replace('TeacherTabs');
        return true;
      case 'admin':
        navigation.replace('AdminTabs', { userRole: normalizedRole });
        return true;
      case 'parent':
        navigation.replace('ParentTabs');
        return true;
      case 'student':
        // Students are always assigned a batch by the admin when their
        // account is created — no separate batch-selection step needed.
        navigation.replace('MainTabs');
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    setResolving(true);
    try {
      // The role passed in via navigation params can go stale (e.g. if this
      // screen is reached after a token refresh) or arrive with inconsistent
      // casing. The stored auth token is the source of truth, so re-verify the
      // role against it before deciding where to send the user.
      let role = userProfile?.role;
      let batchId = userProfile?.batch_id;
      if (!role) {
        const token = await getAuthToken();
        if (token) {
          const profile = await fetchAndStoreProfile(setUserProfile);
          role = profile?.role;
          batchId = profile?.batch_id;
        }
      }

      if (routeForRole(role, batchId)) return;

      // Fall back to whatever role was passed at login time, in case the
      // profile fetch didn't return one.
      if (routeForRole(routeRole, batchId)) return;

      Alert.alert(
        'Login issue',
        `We couldn't determine your account type ("${role || routeRole || 'unknown'}"). Please contact support.`
      );
    } catch (err) {
      console.error('Failed to resolve role after Google link:', err.message);
      if (!routeForRole(routeRole)) {
        Alert.alert('Login issue', 'Could not verify your account. Please try logging in again.');
      }
    } finally {
      setResolving(false);
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
              disabled={!request || resolving}
            >
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Skip */}
            <TouchableOpacity onPress={handleNext} disabled={resolving}>
              {resolving ? (
                <ActivityIndicator color="#1E40AF" style={{ marginTop: 6 }} />
              ) : (
                <Text style={styles.skipText}>Skip for now</Text>
              )}
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
