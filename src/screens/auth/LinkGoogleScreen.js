import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

WebBrowser.maybeCompleteAuthSession();

export default function LinkGoogleScreen({ route, navigation }) {
  const { role } = route?.params || {};

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleNext();
    }
  }, [response]);

  const handleNext = () => {
    if (role === 'owner') {
      navigation.replace('OwnerTabs');
    } else if (role === 'admin' || role === 'teacher') {
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