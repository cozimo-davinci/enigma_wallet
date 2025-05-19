import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getMarketData, getTrendingCoins, CryptoAsset as ApiCryptoAsset } from '../../external_api/externalAPI';
import { RootStackParamList } from '../../navigation/RootNavigator';

interface CryptoAsset {
  id: string;
  symbol: string;
  logo: string; // Image URL from API
  name: string;
  price: number;
  change: number;
}

const tabs = ['Trending', 'Gainers', 'Losers', 'Search'];

type NavigationProp = StackNavigationProp<RootStackParamList, 'Wallet'>;

const CryptoAssetsPrices = () => {
  const [activeTab, setActiveTab] = useState('Trending');
  const [cryptoData, setCryptoData] = useState<{ [key: string]: CryptoAsset[] }>({
    Trending: [],
    Gainers: [],
    Losers: [],
  });
  const [allCoins, setAllCoins] = useState<CryptoAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CryptoAsset[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const navigation = useNavigation<NavigationProp>();

  const fetchData = async () => {
    const marketData = await getMarketData();
    const trendingIds = await getTrendingCoins();

    // Map API data to component's CryptoAsset interface
    const mappedData: CryptoAsset[] = marketData.map((coin: ApiCryptoAsset) => ({
      id: coin.id,
      symbol: coin.symbol,
      logo: coin.image, // Use image URL from API
      name: coin.name,
      price: coin.current_price,
      change: coin.price_change_percentage_24h || 0,
    }));

    // Categorize data
    const trendingCoins = mappedData.filter((coin) => trendingIds.includes(coin.id));
    const gainers = [...mappedData]
      .sort((a, b) => b.change - a.change)
      .slice(0, 50); // Top 50 gainers
    const losers = [...mappedData]
      .sort((a, b) => a.change - b.change)
      .slice(0, 50); // Top 50 losers

    setCryptoData({
      Trending: trendingCoins,
      Gainers: gainers,
      Losers: losers,
    });
    setAllCoins(mappedData); // Store all coins for search functionality
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
    } else {
      const filtered = allCoins.filter((coin) =>
        coin.symbol.toLowerCase().includes(query.toLowerCase()) ||
        coin.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 10)); // Limit to 10 results
    }
  };

  const getPaginatedData = (data: CryptoAsset[]) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = (data: CryptoAsset[]) => Math.ceil(data.length / itemsPerPage);

  const renderCryptoItem = (item: CryptoAsset) => {
    const formattedPrice = item.price < 1 ? `$${item.price.toFixed(6)}` : `$${item.price.toLocaleString()}`;
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.cryptoCard}
        onPress={() => navigation.navigate('CryptoDetails', { assetId: item.id, assetName: item.name })}
      >
        <View style={styles.logoContainer}>
          <Image source={{ uri: item.logo }} style={styles.logoImage} />
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
            onPress={() => {
              setActiveTab(tab);
              if (tab !== 'Search') {
                setPage(1); // Reset page when switching tabs, except for Search
              }
            }}
          >
            <Text style={[styles.tabText, activeTab === tab ? styles.activeTabText : null]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === 'Search' ? (
        <View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by symbol or name"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <View style={styles.listContainer}>
            {searchResults.map((item) => renderCryptoItem(item))}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.listContainer}>
            {getPaginatedData(cryptoData[activeTab]).map((item) => renderCryptoItem(item))}
          </View>
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageButton, page === 1 && styles.disabledButton]}
              onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              <Text style={styles.pageButtonText}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.pageText}>
              Page {page} of {totalPages(cryptoData[activeTab])}
            </Text>
            <TouchableOpacity
              style={[
                styles.pageButton,
                page === totalPages(cryptoData[activeTab]) && styles.disabledButton,
              ]}
              onPress={() => setPage((prev) => Math.min(prev + 1, totalPages(cryptoData[activeTab])))}
              disabled={page === totalPages(cryptoData[activeTab])}
            >
              <Text style={styles.pageButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
    alignItems: 'center',
    alignSelf: 'center'
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
  listContainer: {
    // No maxHeight here to allow dynamic sizing
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
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 20,
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  pageButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  pageButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
  pageText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#1A1A1A',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  searchInput: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    shadowColor: '#535956',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.7,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default CryptoAssetsPrices;