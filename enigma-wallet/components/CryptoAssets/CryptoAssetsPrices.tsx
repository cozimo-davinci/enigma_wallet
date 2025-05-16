import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { RootStackParamList } from '../../navigation/RootNavigator';

interface CryptoAsset {
  id: string;
  logo: string;
  name: string;
  price: number;
  change: number;
}

const tabs = ['Trending', 'Gainers', 'New', 'Volume'];

type NavigationProp = StackNavigationProp<RootStackParamList, 'Wallet'>;

const CryptoAssetsPrices = () => {
  const [activeTab, setActiveTab] = useState('Trending');
  const [cryptoData, setCryptoData] = useState<{ [key: string]: CryptoAsset[] }>({
    Trending: [],
    Gainers: [],
    New: [],
    Volume: [],
  });
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Check cached data
        const cachedData = await AsyncStorage.getItem('cryptoMarketData');
        const cachedTimestamp = await AsyncStorage.getItem('cryptoMarketDataTimestamp');
        const now = Date.now();
        const cacheValid = cachedTimestamp && now - parseInt(cachedTimestamp) < 5 * 60 * 1000; // 5 minutes

        if (cachedData && cacheValid) {
          setCryptoData(JSON.parse(cachedData));
          return;
        }

        // Fetch from CoinGecko
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano,ripple,polkadot,near-protocol,avalanche-2,terra-luna,binancecoin,dogecoin,shiba-inu&order=market_cap_desc&per_page=100&page=1&sparkline=false'
        );

        const data = response.data;
        const mappedData: CryptoAsset[] = data.map((coin: any) => ({
          id: coin.id,
          logo: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change: coin.price_change_percentage_24h,
        }));

        // Categorize data (simplified for demo)
        const newData = {
          Trending: mappedData.slice(0, 3), // BTC, ETH, SOL
          Gainers: mappedData.filter((coin) => coin.change > 0).slice(0, 3), // Top gainers
          New: mappedData.slice(6, 9), // NEAR, AVAX, LUNA
          Volume: mappedData.slice(9, 12), // BNB, DOGE, SHIB
        };

        setCryptoData(newData);
        await AsyncStorage.setItem('cryptoMarketData', JSON.stringify(newData));
        await AsyncStorage.setItem('cryptoMarketDataTimestamp', now.toString());
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };
    fetchMarketData();
  }, []);

  const renderCryptoItem = ({ item }: { item: CryptoAsset }) => {
    const formattedPrice = item.price < 1 ? `$${item.price.toFixed(6)}` : `$${item.price.toLocaleString()}`;
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
            {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
          </Text>
        </View>
        <Text style={styles.priceText}>{formattedPrice}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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
    maxHeight: 300,
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

export default CryptoAssetsPrices;