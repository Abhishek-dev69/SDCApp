import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminAnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Analytics Screen</Text>
      <Text style={styles.subtext}>Coming Soon</Text>
    </View>
  );
}

const PlaceholderScreen = ({ name }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{name} Screen</Text>
    <Text style={styles.subtext}>Coming Soon</Text>
  </View>
);

export const AdminFinancesScreen = () => <PlaceholderScreen name="Finances" />;
export const AdminSettingsScreen = () => <PlaceholderScreen name="Settings" />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtext: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
});
