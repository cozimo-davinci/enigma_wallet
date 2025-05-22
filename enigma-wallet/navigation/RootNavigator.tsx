import * as React from 'react';
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WalletScreen from '../screens/WalletScreen';
import MarketsScreen from '../screens/MarketsScreen';
import NftScreen from '../screens/NFTScreen';
import SwapScreen from '../screens/SwapScreen';
import StakeScreen from '../screens/StakeScreen';
import AssetDetailsScreen from '../screens/AssetDetailsScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SeedPhraseConfirmationScreen from '../screens/SeedPhraseConfirmationScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import ProfileDetails from '../screens/ProfileDetails';
import LoginScreen from '../screens/LoginScreen';
import AuthContext from './AuthContext';
import Toast from 'react-native-toast-message';

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

// Navigation types
export type RootStackParamList = {
  Registration: undefined;
  Login: undefined;
  Onboarding: undefined;
  Main: undefined;
  Wallet: { addresses: { ethereum: string; bitcoin: string; solana: string } };
  CryptoDetails: { assetId: string; assetName: string };
  Markets: undefined;
  Welcome: undefined;
  SeedPhraseConfirmation: { seedPhrase: string; addresses: { ethereum: string; bitcoin: string; solana: string } };
  ProfileDetails: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  SeedPhraseConfirmation: { seedPhrase: string; addresses: { ethereum: string; bitcoin: string; solana: string } };
  Main: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

// Nested routes for the Wallet Service
function WalletStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetails} />
    </Stack.Navigator>
  );
}

// Nested Routes for the Markets Service
function MarketsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Markets" component={MarketsScreen} />
      <Stack.Screen name="CryptoDetails" component={AssetDetailsScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Wallet"
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
          backgroundColor: '#1A1A1A',
          borderTopColor: '#333',
          borderTopWidth: 4,
          paddingBottom: 10,
          paddingTop: 10,
          height: 100,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          marginTop: 20,
          fontWeight: 'bold',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Markets" component={MarketsStack} />
      <Tab.Screen name="NFT" component={NftScreen} />
      <Tab.Screen name="Wallet" component={WalletStack} />
      <Tab.Screen name="Swap" component={SwapScreen} />
      <Tab.Screen name="Stake" component={StakeScreen} />
    </Tab.Navigator>
  );
}

// Onboarding Stack Navigator
function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SeedPhraseConfirmation" component={SeedPhraseConfirmationScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </OnboardingStack.Navigator>
  );
}

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isWalletCreated, setIsWalletCreated] = useState<boolean | null>(null);

  const setAuthState = (authenticated: boolean, walletCreated: boolean | null) => {
    setIsAuthenticated(authenticated);
    setIsWalletCreated(walletCreated);
  };

  useEffect(() => {
    const checkAuthAndWalletStatus = async () => {
      try {
        // Check if token exists
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setAuthState(false, null);
          return;
        }

        // Verify token and get profile
        try {
          const response = await fetch('http://192.168.68.110:7777/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            throw new Error('Invalid token');
          }
          const profile = await response.json();
          setAuthState(true, !!profile?.walletAddresses);
        } catch (error) {
          // console.error('Error fetching profile:', error);
          Toast.show({
            type: 'info',
            text1: 'Warning',
            text2: 'Your session expired. Please log in again.',
            text1Style: { fontSize: 18, fontWeight: 'bold' },
            text2Style: { fontSize: 16 },
            position: 'top',
            visibilityTime: 4000,
          });
          setAuthState(false, null);
          await AsyncStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthState(false, null);
      }
    };

    checkAuthAndWalletStatus();
  }, []);

  if (isAuthenticated === null || (isAuthenticated && isWalletCreated === null)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FF83" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ setAuthState }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Registration" component={RegistrationScreen} />
              
            </>
          ) : isWalletCreated ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
});