import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, BookOpen, CalendarDays, BarChart3, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminTimetableScreen from '../screens/admin/AdminTimetableScreen';
import AdminBatchesScreen from '../screens/admin/AdminBatchesScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import { useUserSession } from '../context/UserSessionContext';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator({ route }) {
  const { userProfile } = useUserSession();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const userRole = userProfile?.role || route?.params?.userRole || 'admin';
  const displayName = userProfile?.name || route?.params?.displayName || 'Admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let IconComponent;

          if (route.name === 'Dashboard') IconComponent = LayoutDashboard;
          else if (route.name === 'Timetable') IconComponent = CalendarDays;
          else if (route.name === 'Batches') IconComponent = BookOpen;
          else if (route.name === 'Analytics') IconComponent = BarChart3;
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
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
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
      <Tab.Screen name="Timetable" component={AdminTimetableScreen} />
      <Tab.Screen name="Batches" component={AdminBatchesScreen} />
      {userRole !== 'teacher' && <Tab.Screen name="Analytics" component={AdminAnalyticsScreen} />}
      <Tab.Screen
        name="Settings"
        component={AdminSettingsScreen}
        initialParams={{ userRole, displayName }}
      />
    </Tab.Navigator>
  );
}
