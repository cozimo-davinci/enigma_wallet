import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import debounce from 'lodash.debounce';
import TokenListInWallet from './TokenListInWallet'; 
import { getMarketData } from '../../external_api/externalAPI'; 
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { StackNavigationProp } from '@react-navigation/stack';

interface ButtonProps {
  iconName: string;
  title: string;
  onPress: () => void;
}

interface BalanceResponse {
  nativeBalance: string;
  tokens: Array<{
    tokenAddress: string;
    name?: string;
    symbol?: string;
    balance: string;
    usdValue?: number;
    logo?: string;
    price?: number;
    change?: number;
  }>;
}

interface CoinPrice {
  usd: number;
}

interface CachedData<T> {
  data: T;
  expiresAt: number;
}
type NavigationProp = StackNavigationProp<RootStackParamList>;

const BalanceCard = () => {
  const [addresses, setAddresses] = useState<{ ethereum: string; bitcoin: string; solana: string } | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'bitcoin' | 'solana'>('ethereum');
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null);
  const [totalUsdBalance, setTotalUsdBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const getCoinGeckoId = (symbol: string | undefined): string | null => {
    if (!symbol) return null;
    const symbolLower = symbol.toLowerCase();
    const mapping: { [key: string]: string } = {
      usdt: 'tether',
      usdc: 'usd-coin',
      dai: 'dai',
      weth: 'weth',
      uni: 'uniswap',
      link: 'chainlink',
      aave: 'aave',
      shib: 'shiba-inu',
      matic: 'matic-network',
      srm: 'serum',
      ray: 'raydium',
    };
    return mapping[symbolLower] || null;
  };

  async function retryRequest<T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 429) {
          if (attempt === maxRetries) throw error;
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(`Rate limit hit, retrying after ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Retry logic failed');
  }

  async function getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, expiresAt }: CachedData<T> = JSON.parse(cached);
      if (Date.now() > expiresAt) {
        console.debug(`Cache expired for ${key}`);
        await AsyncStorage.removeItem(key);
        return null;
      }
      return data;
    } catch (error) {
      console.warn(`Error reading cache for ${key}:`, error);
      return null;
    }
  }

  async function setCachedData<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    try {
      const cachedData: CachedData<T> = {
        data,
        expiresAt: Date.now() + ttlSeconds * 1000,
      };
      await AsyncStorage.setItem(key, JSON.stringify(cachedData));
      console.debug(`Cached data for ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      console.warn(`Error caching data for ${key}:`, error);
    }
  }

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('No authentication token found.');
        const response = await axios.get('http://192.168.68.110:7777/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { walletAddresses } = response.data;
        if (walletAddresses) {
          setAddresses(walletAddresses);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'No wallet addresses found.',
            text1Style: { fontSize: 18, fontWeight: 'bold' },
            text2Style: { fontSize: 16 },
            position: 'top',
            visibilityTime: 4000,
          });
        }
      } catch (error: any) {
        console.error('Error loading addresses:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.error || error.message || 'Failed to load wallet addresses.',
          text1Style: { fontSize: 18, fontWeight: 'bold' },
          text2Style: { fontSize: 16 },
          position: 'top',
          visibilityTime: 4000,
        });
      }
    };
    loadAddresses();
  }, []);

  const fetchBalanceAndPrices = debounce(async (forceRefresh: boolean = false) => {
    if (!addresses || !addresses[selectedNetwork]) return;
    setLoading(true);
    const balanceCacheKey = `balance:${selectedNetwork}:${addresses[selectedNetwork]}`;
    const nativeCoinId = { ethereum: 'ethereum', bitcoin: 'bitcoin', solana: 'solana' }[selectedNetwork];
    let priceCacheKey = `prices:${[nativeCoinId].sort().join(',')}`;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');

      let balanceData: BalanceResponse | null = null;
      if (!forceRefresh) {
        balanceData = await getCachedData<BalanceResponse>(balanceCacheKey);
      }

      if (!balanceData) {
        const balanceResponse = await retryRequest(() =>
          axios.post(
            'http://192.168.68.110:7777/api/blockchain/balance',
            { blockchain: selectedNetwork, address: addresses[selectedNetwork] },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
        balanceData = balanceResponse.data;
        await setCachedData(balanceCacheKey, balanceData, 120);
      }

      if (!balanceData) throw new Error('No balance data available');

      // Fetch market data for all tokens
      const marketData = await getMarketData();
      const marketDataMap = new Map(marketData.map((coin: any) => [coin.id, coin]));

      const tokenIds = balanceData.tokens
        .map((token) => getCoinGeckoId(token.symbol))
        .filter((id) => id) as string[];
      if (tokenIds.length > 0) {
        priceCacheKey = `prices:${[nativeCoinId, ...tokenIds].sort().join(',')}`;
      }

      let priceData: { [key: string]: CoinPrice } = {};
      if (!forceRefresh) {
        priceData = (await getCachedData<{ [key: string]: CoinPrice }>(priceCacheKey)) || {};
      }

      if (!Object.keys(priceData).length && (tokenIds.length > 0 || nativeCoinId)) {
        const priceIds = [nativeCoinId, ...tokenIds].join(',');
        const priceResponse = await retryRequest(() =>
          axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${priceIds}&vs_currencies=usd`)
        );
        priceData = priceResponse.data;
        await setCachedData(priceCacheKey, priceData, 60);
      }

      const nativeAmount = parseFloat(balanceData.nativeBalance.split(' ')[0]) || 0;
      const nativeUsdPrice = priceData[nativeCoinId]?.usd || 0;
      let totalUsd = nativeAmount * nativeUsdPrice;

      const tokenBalances = balanceData.tokens.map((token) => {
        const coinId = getCoinGeckoId(token.symbol);
        const tokenUsdPrice = coinId ? priceData[coinId]?.usd || 0 : 0;
        const tokenAmount = parseFloat(token.balance) || 0;
        const usdValue = tokenAmount * tokenUsdPrice;
        totalUsd += usdValue;

        const marketInfo = marketDataMap.get(coinId || '');
        return {
          ...token,
          usdValue,
          logo: marketInfo?.image,
          price: tokenUsdPrice,
          change: marketInfo?.price_change_percentage_24h,
        };
      });

      setTotalUsdBalance(totalUsd);
      setBalanceData({ ...balanceData, tokens: tokenBalances, nativeBalance: balanceData.nativeBalance });
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      const errorMessage =
        error.response?.status === 429
          ? 'Rate limit exceeded, showing cached data.'
          : error.response?.data?.error || error.message || 'Failed to fetch balance.';
      if (error.response?.status === 429) {
        const cachedBalanceData = await getCachedData<BalanceResponse>(balanceCacheKey);
        if (cachedBalanceData) {
          let priceData = (await getCachedData<{ [key: string]: CoinPrice }>(priceCacheKey)) || {};
          const nativeAmount = parseFloat(cachedBalanceData.nativeBalance.split(' ')[0]) || 0;
          const nativeUsdPrice = priceData[nativeCoinId]?.usd || 0;
          let totalUsd = nativeAmount * nativeUsdPrice;

          const tokenBalances = cachedBalanceData.tokens.map((token) => {
            const coinId = getCoinGeckoId(token.symbol);
            const tokenUsdPrice = coinId ? priceData[coinId]?.usd || 0 : 0;
            const tokenAmount = parseFloat(token.balance) || 0;
            const usdValue = tokenAmount * tokenUsdPrice;
            totalUsd += usdValue;
            return { ...token, usdValue };
          });

          setTotalUsdBalance(totalUsd);
          setBalanceData({ ...cachedBalanceData, tokens: tokenBalances, nativeBalance: cachedBalanceData.nativeBalance });
        }
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        text1Style: { fontSize: 18, fontWeight: 'bold' },
        text2Style: { fontSize: 16 },
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, 1000);

  useEffect(() => {
    fetchBalanceAndPrices();
    return () => fetchBalanceAndPrices.cancel();
  }, [selectedNetwork, addresses]);

  const handleRefresh = async () => {
    const balanceCacheKey = `balance:${selectedNetwork}:${addresses && addresses[selectedNetwork]}`;
    const priceCacheKey = `prices:${
      [
        { ethereum: 'ethereum', bitcoin: 'bitcoin', solana: 'solana' }[selectedNetwork],
        ...(balanceData?.tokens.map((token) => getCoinGeckoId(token.symbol)).filter((id) => id) || []),
      ].sort().join(',')
    }`;
    await AsyncStorage.removeItem(balanceCacheKey);
    await AsyncStorage.removeItem(priceCacheKey);
    fetchBalanceAndPrices(true);
  };

  const copyToClipboard = async (address: string) => {
    if (address && address !== 'Loading...') {
      await Clipboard.setStringAsync(address);
      Toast.show({
        type: 'success',
        text1: 'Copied',
        text2: 'Address copied to clipboard',
        text1Style: { fontSize: 18, fontWeight: 'bold' },
        text2Style: { fontSize: 16 },
        position: 'top',
        visibilityTime: 4000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No address available to copy.',
        text1Style: { fontSize: 18, fontWeight: 'bold' },
        text2Style: { fontSize: 16 },
        position: 'top',
        visibilityTime: 4000,
      });
    }
  };

  const buttons: ButtonProps[] = [
    { iconName: 'add', title: 'Deposit', onPress: () => console.log('Deposit pressed') },
    { iconName: 'cash', title: 'Earn', onPress: () => console.log('Earn pressed') },
    { iconName: 'share-social', title: 'Referral', onPress: () => console.log('Referral pressed') },
  ];

  const networkNames = { ethereum: 'Ethereum', bitcoin: 'Bitcoin', solana: 'Solana' };
  const networkOptions = [
    { label: 'Ethereum', value: 'ethereum' },
    { label: 'Bitcoin', value: 'bitcoin' },
    { label: 'Solana', value: 'solana' },
  ];
  const selectedAddress = addresses ? addresses[selectedNetwork] : 'Loading...';

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const selectNetwork = (value: 'ethereum' | 'bitcoin' | 'solana') => {
    setSelectedNetwork(value);
    setIsDropdownOpen(false);
  };

  const handleAvatarPress = () => {
    navigation.navigate('ProfileDetails');
  }

  return (
    <View>
      <View style={styles.balanceCard}>
        {/* Dropdown */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity style={styles.dropdownContainer} onPress={toggleDropdown}>
            <Text style={styles.dropdownText}>{networkNames[selectedNetwork]}</Text>
            <Ionicons name={isDropdownOpen ? 'chevron-up' : 'chevron-down'} size={20} color="white" />
          </TouchableOpacity>
          {isDropdownOpen && (
            <View style={styles.dropdownList}>
              {networkOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownItem}
                  onPress={() => selectNetwork(option.value as 'ethereum' | 'bitcoin' | 'solana')}
                >
                  <Text style={styles.dropdownItemText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={30} color="#1A1A1A" />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleAvatarPress}>
            <Ionicons name="person" size={30} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainDataContainer}>
        {/* Address Row */}
        <View style={styles.addressRow}>
          <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
            {selectedAddress}
          </Text>
          <TouchableOpacity onPress={() => copyToClipboard(selectedAddress)}>
            <Ionicons name="copy-outline" size={20} color="black" style={styles.copyIcon} />
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View style={styles.balanceContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#FFF" />
          ) : balanceData ? (
            <>
              <Text style={styles.balanceText}>
                Total Balance: ${totalUsdBalance?.toFixed(2) || '0.00'} USD
              </Text>
              <Text style={styles.balanceText}>Native: {balanceData.nativeBalance}</Text>
            </>
          ) : (
            <Text style={styles.balanceText}>Balance: Not available</Text>
          )}
        </View>
      </View>
      </View>
      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {buttons.map((button, index) => (
          <TouchableOpacity key={index} style={styles.buttonCard} onPress={button.onPress}>
            <View style={styles.iconContainer}>
              <Ionicons name={button.iconName as any} size={24} color="#00FF83" />
            </View>
            <Text style={styles.buttonText}>{button.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

       {/* Token List */}
      <TokenListInWallet balanceData={balanceData} loading={loading} />

    </View>
  );
};

export default BalanceCard;

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: '#00FF83',
    borderWidth: 2,
    borderRadius: 20,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 20,
    margin: 10,
    width: '100%',
    height: 'auto',
    alignSelf: 'center',
    flexDirection: 'column',
    alignItems: 'center',
  },
  dropdownWrapper: {
    width: '50%',
    marginBottom: 15,
    alignItems: 'center',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'space-between',
    minWidth: 200,
  },
  dropdownText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownList: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444444',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 180,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  dropdownItemText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  refreshButton: {
    position: 'absolute',
    top: 20,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 5,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    position: 'absolute',
    top: 16,
    left: 10,
    
  },
  mainDataContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#535956',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    width: '100%',
  },
  addressText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    marginRight: 10,
  },
  copyIcon: {
    backgroundColor: '#00FF83',
    padding: 5,
    borderRadius: 10,
  },
  balanceContainer: {
    width: '100%',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginVertical: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  buttonCard: {
    backgroundColor: '#161716',
    borderWidth: 2,
    borderRadius: 15,
    borderColor: '#1A1A1A',
    padding: 10,
    width: '28%',
    alignItems: 'center',
    shadowColor: '#535956',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: '#3b403d',
  },
});