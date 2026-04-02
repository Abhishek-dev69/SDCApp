import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BarChart3, Calendar, Banknote, User } from 'lucide-react-native';
import ParentDashboardScreen from '../screens/parent/ParentDashboardScreen';
import ParentPerformanceScreen from '../screens/parent/ParentPerformanceScreen';
import ParentAttendanceScreen from '../screens/parent/ParentAttendanceScreen';
import ParentFeesScreen from '../screens/parent/ParentFeesScreen';
import ParentProfileScreen from '../screens/parent/ParentProfileScreen';

const Tab = createBottomTabNavigator();

export default function ParentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let IconComponent;

          if (route.name === 'Dashboard') IconComponent = Home;
          else if (route.name === 'Performance') IconComponent = BarChart3;
          else if (route.name === 'Attendance') IconComponent = Calendar;
          else if (route.name === 'Fees') IconComponent = Banknote;
          else if (route.name === 'Profile') IconComponent = User;

          return <IconComponent size={size} color={color} />;
        },
        tabBarActiveTintColor: '#28388f',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={ParentDashboardScreen} />
      <Tab.Screen name="Performance" component={ParentPerformanceScreen} />
      <Tab.Screen name="Attendance" component={ParentAttendanceScreen} />
      <Tab.Screen name="Fees" component={ParentFeesScreen} />
      <Tab.Screen name="Profile" component={ParentProfileScreen} />
    </Tab.Navigator>
  );
}
