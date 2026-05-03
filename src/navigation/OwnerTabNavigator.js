import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BarChart3, Home, IndianRupee, User, Users } from 'lucide-react-native';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import {
  OwnerAnalyticsScreen,
  OwnerBatchesScreen,
  OwnerProfileScreen,
  OwnerRevenueScreen,
} from '../screens/owner/OwnerExtraScreens';

const Tab = createBottomTabNavigator();

export default function OwnerTabNavigator({ route }) {
  const displayName = route?.params?.displayName || 'Natik Sir';

  return (
    <Tab.Navigator
      screenOptions={({ route: tabRoute }) => ({
        tabBarIcon: ({ color, focused }) => {
          let IconComponent = Home;

          if (tabRoute.name === 'Dashboard') IconComponent = Home;
          else if (tabRoute.name === 'Analytics') IconComponent = BarChart3;
          else if (tabRoute.name === 'Revenue') IconComponent = IndianRupee;
          else if (tabRoute.name === 'Batches') IconComponent = Users;
          else if (tabRoute.name === 'Profile') IconComponent = User;

          return <IconComponent size={focused ? 22 : 20} color={color} />;
        },
        tabBarActiveTintColor: '#28388F',
        tabBarInactiveTintColor: '#64748B',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 78,
          paddingBottom: 10,
          paddingTop: 7,
          borderRadius: 24,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.10,
          shadowRadius: 18,
          elevation: 12,
        },
        tabBarItemStyle: {
          marginHorizontal: 3,
          marginVertical: 5,
          borderRadius: 18,
        },
        tabBarActiveBackgroundColor: '#EEF2FF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboardScreen}
        initialParams={{ displayName }}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Analytics"
        component={OwnerAnalyticsScreen}
        initialParams={{ displayName }}
        options={{ tabBarLabel: 'Insights' }}
      />
      <Tab.Screen
        name="Revenue"
        component={OwnerRevenueScreen}
        initialParams={{ displayName }}
        options={{ tabBarLabel: 'Money' }}
      />
      <Tab.Screen
        name="Batches"
        component={OwnerBatchesScreen}
        initialParams={{ displayName }}
      />
      <Tab.Screen
        name="Profile"
        component={OwnerProfileScreen}
        initialParams={{ displayName }}
      />
    </Tab.Navigator>
  );
}
