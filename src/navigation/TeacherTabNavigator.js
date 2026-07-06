import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageCircle, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import TeacherDoubtsScreen from '../screens/teacher/TeacherDoubtsScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';

const Tab = createBottomTabNavigator();

export default function TeacherTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let IconComponent = Home;
          if (route.name === 'Doubts') IconComponent = MessageCircle;
          else if (route.name === 'Profile') IconComponent = User;
          return <IconComponent size={size} color={color} />;
        },
        tabBarActiveTintColor: '#28388F',
        tabBarInactiveTintColor: '#64748B',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={TeacherDashboardScreen} />
      <Tab.Screen name="Doubts" component={TeacherDoubtsScreen} />
      <Tab.Screen name="Profile" component={TeacherProfileScreen} />
    </Tab.Navigator>
  );
}
