import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, FileText, MessageCircle, User } from 'lucide-react-native';
import StudentHomeScreen from '../screens/StudentHomeScreen';
import LecturesStackNavigator from './LecturesStackNavigator';
import { TestsScreen, DoubtsScreen, ProfileScreen } from '../screens/tabs/TabPlaceholders';

const Tab = createBottomTabNavigator();

export default function StudentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let IconComponent;

          if (route.name === 'Home') IconComponent = Home;
          else if (route.name === 'Lectures') IconComponent = BookOpen;
          else if (route.name === 'Tests') IconComponent = FileText;
          else if (route.name === 'Doubts') IconComponent = MessageCircle;
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
      <Tab.Screen name="Home" component={StudentHomeScreen} />
      <Tab.Screen name="Lectures" component={LecturesStackNavigator} />
      <Tab.Screen name="Tests" component={TestsScreen} />
      <Tab.Screen name="Doubts" component={DoubtsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
