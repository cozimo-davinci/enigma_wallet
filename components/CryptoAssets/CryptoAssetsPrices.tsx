import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

interface CryptoAsset {
  id: string;
  logo: string; 
  name: string;
  price: number;
  change: number; // Percentage change 
}

const tabs = ['Trending', 'Gainers', 'New', 'Volume'];

const cryptoData: { [key: string]: CryptoAsset[] } = {
  Trending: [
    { id: '1', logo: 'BTC', name: 'Bitcoin', price: 105000, change: 2.5 },
    { id: '2', logo: 'ETH', name: 'Ethereum', price: 2800, change: -1.2 },
    { id: '3', logo: 'SOL', name: 'Solana', price: 180, change: 3.8 },
  ],
  Gainers: [
    { id: '4', logo: 'ADA', name: 'Cardano', price: 0.45, change: 5.1 },
    { id: '5', logo: 'XRP', name: 'Ripple', price: 0.75, change: 4.2 },
    { id: '6', logo: 'DOT', name: 'Polkadot', price: 6.5, change: 3.9 },
  ],
  New: [
    { id: '7', logo: 'NEAR', name: 'NEAR Protocol', price: 5.2, change: 1.8 },
    { id: '8', logo: 'AVAX', name: 'Avalanche', price: 35, change: -0.5 },
    { id: '9', logo: 'LUNA', name: 'Terra', price: 0.6, change: 2.0 },
  ],
  Volume: [
    { id: '10', logo: 'BNB', name: 'Binance Coin', price: 550, change: 1.5 },
    { id: '11', logo: 'DOGE', name: 'Dogecoin', price: 0.15, change: -2.3 },
    { id: '12', logo: 'SHIB', name: 'Shiba Inu', price: 0.00002, change: 4.7 },
  ],
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'Wallet'>;

const CryptoAssetsPrices = () => {
  const [activeTab, setActiveTab] = useState('Trending');
  const navigation = useNavigation<NavigationProp>();

  const renderCryptoItem = ({ item }: { item: CryptoAsset }) => {
    // Custom price formatting based on value
    const formattedPrice = item.price < 1
      ? `$${item.price.toFixed(6)}` // Use 6 decimal places for values < 1
      : `$${item.price.toLocaleString()}`; // Use locale string for larger values

    return (
      <TouchableOpacity
        style={styles.cryptoCard}
        onPress={() => navigation.navigate('CryptoDetails', { assetId: item.id, assetName: item.name })}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>{item.logo}</Text>
        </View>
        <View style={styles.assetInfo}>
          <Text style={styles.assetName}>{item.name}</Text>
          <Text style={[styles.changeText, { color: item.change >= 0 ? '#00FF83' : '#FF4444' }]}>
            {item.change >= 0 ? '+' : ''}{item.change}%
          </Text>
        </View>
        <Text style={styles.priceText}>{formattedPrice}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Tabs */}
      <View style={styles.tabHeader}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab ? styles.activeTab : null]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab ? styles.activeTabText : null]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable List */}
      <FlatList
        data={cryptoData[activeTab]}
        renderItem={renderCryptoItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default CryptoAssetsPrices;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#00FF83',
    borderWidth: 2,
    borderRadius: 20,
    borderColor: '#1A1A1A',
    shadowColor: '#535956',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    margin: 10,
    width: '100%',
    alignSelf: 'center',
    padding: 15,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 15,
    gap: 2.5,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: '#1A1A1A',
  },
  activeTab: {
    backgroundColor: '#444444',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#FFF',
  },
  list: {
    maxHeight: 300, // Limit height to make it scrollable
  },
  cryptoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderRadius: 15,
    borderColor: '#1A1A1A',
    padding: 10,
    marginVertical: 5,
    shadowColor: '#535956',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: '#3b403d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#00FF83',
    fontSize: 16,
    fontWeight: 'bold',
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeText: {
    fontSize: 14,
    marginTop: 2,
  },
  priceText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});