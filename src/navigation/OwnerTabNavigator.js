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
        tabBarIcon: ({ color, size }) => {
          let IconComponent = Home;

          if (tabRoute.name === 'Dashboard') IconComponent = Home;
          else if (tabRoute.name === 'Analytics') IconComponent = BarChart3;
          else if (tabRoute.name === 'Revenue') IconComponent = IndianRupee;
          else if (tabRoute.name === 'Batches') IconComponent = Users;
          else if (tabRoute.name === 'Profile') IconComponent = User;

          return <IconComponent size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2748B3',
        tabBarInactiveTintColor: '#6B7280',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 84,
          paddingBottom: 10,
          paddingTop: 8,
          borderRadius: 30,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 12,
        },
        tabBarItemStyle: {
          marginHorizontal: 4,
          marginVertical: 6,
          borderRadius: 22,
        },
        tabBarActiveBackgroundColor: '#EEF2FF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboardScreen}
        initialParams={{ displayName }}
      />
      <Tab.Screen name="Analytics" component={OwnerAnalyticsScreen} />
      <Tab.Screen name="Revenue" component={OwnerRevenueScreen} />
      <Tab.Screen name="Batches" component={OwnerBatchesScreen} />
      <Tab.Screen
        name="Profile"
        component={OwnerProfileScreen}
        initialParams={{ displayName }}
      />
    </Tab.Navigator>
  );
}
