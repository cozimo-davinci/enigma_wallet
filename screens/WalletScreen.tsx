import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BalanceCard from '../components/BalanceCard/BalanceCard';
import CryptoAssetsPrices from '../components/CryptoAssets/CryptoAssetsPrices';

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.contentWrapper}>
        <BalanceCard />
        <CryptoAssetsPrices />
      </View>  
      
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Updated to match theme
    padding: 20,
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
    textAlign: 'center', // Center the title within 95%
  },
  subtitle: {
    color: '#00FF83', // Updated to match theme
    fontSize: 16,
  },
});