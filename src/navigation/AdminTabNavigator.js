import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, BookOpen, BarChart3, Banknote, Settings } from 'lucide-react-native';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminBatchesScreen from '../screens/admin/AdminBatchesScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminFinancesScreen from '../screens/admin/AdminFinancesScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator({ route }) {
  const userRole = route?.params?.userRole || 'admin';
  const displayName = route?.params?.displayName || 'Admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let IconComponent;

          if (route.name === 'Dashboard') IconComponent = LayoutDashboard;
          else if (route.name === 'Batches') IconComponent = BookOpen;
          else if (route.name === 'Analytics') IconComponent = BarChart3;
          else if (route.name === 'Finances') IconComponent = Banknote;
          else if (route.name === 'Settings') IconComponent = Settings;

          return <IconComponent size={size} color={color} />;
        },
        tabBarActiveTintColor: '#28388f',
        tabBarInactiveTintColor: 'gray',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        initialParams={{ userRole, displayName }}
      />
      <Tab.Screen name="Batches" component={AdminBatchesScreen} />
      <Tab.Screen name="Analytics" component={AdminAnalyticsScreen} />
      <Tab.Screen name="Finances" component={AdminFinancesScreen} />
      <Tab.Screen
        name="Settings"
        component={AdminSettingsScreen}
        initialParams={{ userRole, displayName }}
      />
    </Tab.Navigator>
  );
}
