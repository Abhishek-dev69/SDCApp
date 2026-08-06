import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
<<<<<<< Updated upstream
import { Home, MessageCircle, User, ClipboardList } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import TeacherDoubtsScreen from '../screens/teacher/TeacherDoubtsScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';
import TeacherRemarksScreen from '../screens/teacher/TeacherRemarksScreen';

const Tab = createBottomTabNavigator();

export default function TeacherTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
=======
import { LayoutDashboard, BookOpen, Award, MessageSquare, Settings } from 'lucide-react-native';
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import AdminTimetableScreen from '../screens/admin/AdminTimetableScreen';
import TeacherTestsScreen from '../screens/teacher/TeacherTestsScreen';
import TeacherDoubtsScreen from '../screens/teacher/TeacherDoubtsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';

const Tab = createBottomTabNavigator();

export default function TeacherTabNavigator({ route }) {
  const userRole = route?.params?.userRole || 'teacher';
  const displayName = route?.params?.displayName || 'Teacher';
>>>>>>> Stashed changes

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
<<<<<<< Updated upstream
          let IconComponent = Home;
          if (route.name === 'Doubts') IconComponent = MessageCircle;
          else if (route.name === 'Remarks') IconComponent = ClipboardList;
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
      <Tab.Screen name="Remarks" component={TeacherRemarksScreen} />
      <Tab.Screen name="Profile" component={TeacherProfileScreen} />
=======
          let IconComponent;

          if (route.name === 'Dashboard') IconComponent = LayoutDashboard;
          else if (route.name === 'Schedule') IconComponent = BookOpen;
          else if (route.name === 'Tests') IconComponent = Award;
          else if (route.name === 'Doubts') IconComponent = MessageSquare;
          else if (route.name === 'Settings') IconComponent = Settings;

          return <IconComponent size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10B981',
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
        component={TeacherDashboardScreen}
        initialParams={{ userRole, displayName }}
      />
      <Tab.Screen name="Schedule" component={AdminTimetableScreen} />
      <Tab.Screen name="Tests" component={TeacherTestsScreen} />
      <Tab.Screen name="Doubts" component={TeacherDoubtsScreen} />
      <Tab.Screen
        name="Settings"
        component={AdminSettingsScreen}
        initialParams={{ userRole, displayName }}
      />
>>>>>>> Stashed changes
    </Tab.Navigator>
  );
}
