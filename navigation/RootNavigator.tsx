import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import WalletScreen from '../screens/WalletScreen';
import MarketsScreen from '../screens/MarketsScreen';
import NftScreen from '../screens/NFTScreen';
import SwapScreen from '../screens/SwapScreen';
import StakeScreen from '../screens/StakeScreen';
import AssetDetailsScreen from '../screens/AssetDetailsScreen';

// Define valid Ionicons names for TypeScript
type IconName =
  | 'wallet'
  | 'wallet-outline'
  | 'calculator'
  | 'calculator-outline'
  | 'image'
  | 'image-outline'
  | 'repeat'
  | 'repeat-outline'
  | 'bar-chart'
  | 'bar-chart-outline';

export type RootStackParamList = {
  Wallet: undefined;
  CryptoDetails: { assetId: string; assetName: string };
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Nested routes for the Wallet Service
function WalletStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="CryptoDetails" component={AssetDetailsScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: IconName = 'wallet-outline'; // Default icon

            if (route.name === 'Wallet') {
              iconName = focused ? 'wallet' : 'wallet-outline';
            } else if (route.name === 'Markets') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else if (route.name === 'NFT') {
              iconName = focused ? 'image' : 'image-outline';
            } else if (route.name === 'Swap') {
              iconName = focused ? 'repeat' : 'repeat-outline';
            } else if (route.name === 'Stake') {
              iconName = focused ? 'calculator' : 'calculator-outline';
            }

            return (
              <View style={[styles.iconContainer, { backgroundColor: focused ? '#00FF83' : '#444444' }]}>
                <Ionicons name={iconName} size={size - 5} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: {
            backgroundColor: '#1A1A1A', // Dark theme
            borderTopColor: '#333',
            borderTopWidth: 4,
            paddingBottom: 10,
            paddingTop: 10,
            height: 80,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            marginTop: 20,
            fontWeight: 'bold',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Markets" component={MarketsScreen} />
        <Tab.Screen name="NFT" component={NftScreen} />
        <Tab.Screen name="Wallet" component={WalletStack} />
        <Tab.Screen name="Swap" component={SwapScreen} />
        <Tab.Screen name="Stake" component={StakeScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 30, // Half of width/height for a circle
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});