import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HistoryScreen } from '../screens/HistoryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import StatisticsScreen from '../screens/StatisticsScreen';

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Statistics: undefined;
};

type AppNavigatorProps = {
  onLogout: () => Promise<void> | void;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const AppNavigator = ({ onLogout }: AppNavigatorProps) => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#111111',
          tabBarInactiveTintColor: '#9A9A9A',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#EAEAEA',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Statistics') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else {
              iconName = focused ? 'time' : 'time-outline';
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home">{() => <HomeScreen onLogout={onLogout} />}</Tab.Screen>
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Statistics" component={StatisticsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
