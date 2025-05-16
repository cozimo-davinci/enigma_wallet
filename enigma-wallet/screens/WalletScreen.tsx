import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BalanceCard from '../components/BalanceCard/BalanceCard';
import CryptoAssetsPrices from '../components/CryptoAssets/CryptoAssetsPrices';

export default function WalletScreen() {
  const [addresses, setAddresses] = useState<{ ethereum: string; bitcoin: string; solana: string } | null>(null);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const storedAddresses = await AsyncStorage.getItem('walletAddresses');
        if (storedAddresses) {
          setAddresses(JSON.parse(storedAddresses));
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      }
    };
    loadAddresses();
  }, []);
  const clearAsyncStorage = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Success', 'AsyncStorage cleared. Restart the app to reset the onboarding flow.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear AsyncStorage.');
      console.error('Error clearing AsyncStorage:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={{backgroundColor: 'black', borderColor: 'white', borderWidth: 2}}>
          <Text style={styles.title} onPress={clearAsyncStorage}>Clear AsyncStorage</Text>
        </TouchableOpacity>
        <View style={styles.contentWrapper}>
         
          <BalanceCard />
          <CryptoAssetsPrices />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addressContainer: {
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#444444',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
  },
  addressText: {
    fontSize: 14,
    color: '#00FF83',
    marginBottom: 10,
    // wordBreak: 'break-all',
  },
});