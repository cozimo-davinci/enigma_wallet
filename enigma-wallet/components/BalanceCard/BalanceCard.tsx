import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

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
  }>;
}

interface CoinPrice {
  usd: number;
}

const BalanceCard = () => {
  const [addresses, setAddresses] = useState<{ ethereum: string; bitcoin: string; solana: string } | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'bitcoin' | 'solana'>('ethereum');
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null);
  const [totalUsdBalance, setTotalUsdBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // CoinGecko ID mapping for common tokens
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
      // Solana SPL tokens (add more as needed)
      srm: 'serum',
      ray: 'raydium',
      // Add more tokens based on your use case
    };
    return mapping[symbolLower] || null;
  };

  // Fetch wallet addresses from /api/profile
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }

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
            text2: 'No wallet addresses found. Please complete onboarding.',
            text1Style: { fontSize: 18, fontWeight: 'bold' },
            text2Style: { fontSize: 16 },
            position: 'top',
            visibilityTime: 4000,
          });
        }
      } catch (error: any) {
        console.error('Error loading addresses:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to load wallet addresses.';
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          text1Style: { fontSize: 18, fontWeight: 'bold' },
          text2Style: { fontSize: 16 },
          position: 'top',
          visibilityTime: 4000,
        });
      }
    };
    loadAddresses();
  }, []);

  // Fetch balance and USD prices when network or addresses change
  useEffect(() => {
    const fetchBalanceAndPrices = async () => {
      if (!addresses || !addresses[selectedNetwork]) return;

      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found.');
        }

        // Fetch balance from backend
        const balanceResponse = await axios.post(
          'http://192.168.68.110:7777/api/blockchain/balance',
          {
            blockchain: selectedNetwork,
            address: addresses[selectedNetwork],
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const balanceData: BalanceResponse = balanceResponse.data;

        // Fetch USD prices from CoinGecko
        const nativeCoinId = {
          ethereum: 'ethereum',
          bitcoin: 'bitcoin',
          solana: 'solana',
        }[selectedNetwork];

        const tokenIds = balanceData.tokens
          .map((token) => getCoinGeckoId(token.symbol))
          .filter((id) => id) as string[];

        let priceData: { [key: string]: CoinPrice } = {};
        if (tokenIds.length > 0 || nativeCoinId) {
          const priceIds = [nativeCoinId, ...tokenIds].join(',');
          const priceResponse = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${priceIds}&vs_currencies=usd`
          );
          priceData = priceResponse.data;
        }

        // Calculate total USD balance
        const nativeAmount = parseFloat(balanceData.nativeBalance.split(' ')[0]) || 0;
        const nativeUsdPrice = priceData[nativeCoinId]?.usd || 0;
        let totalUsd = nativeAmount * nativeUsdPrice;

        const tokenBalances = balanceData.tokens.map((token) => {
          const coinId = getCoinGeckoId(token.symbol);
          const tokenUsdPrice = coinId ? priceData[coinId]?.usd || 0 : 0;
          const tokenAmount = parseFloat(token.balance) || 0;
          const usdValue = tokenAmount * tokenUsdPrice;
          totalUsd += usdValue;
          return { ...token, usdValue };
        });

        setTotalUsdBalance(totalUsd);
        setBalanceData({ ...balanceData, tokens: tokenBalances });
      } catch (error: any) {
        console.error('Error fetching balance:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch balance.';
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
    };

    fetchBalanceAndPrices();
  }, [selectedNetwork, addresses]);

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

  const networkNames = {
    ethereum: 'Ethereum',
    bitcoin: 'Bitcoin',
    solana: 'Solana',
  };

  const networkOptions = [
    { label: 'Ethereum', value: 'ethereum' },
    { label: 'Bitcoin', value: 'bitcoin' },
    { label: 'Solana', value: 'solana' },
  ];

  const selectedAddress = addresses ? addresses[selectedNetwork] : 'Loading...';

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectNetwork = (value: 'ethereum' | 'bitcoin' | 'solana') => {
    setSelectedNetwork(value);
    setIsDropdownOpen(false);
  };

  return (
    <View>
      <View style={styles.balanceCard}>
        {/* Dropdown */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity style={styles.dropdownContainer} onPress={toggleDropdown}>
            <Text style={styles.dropdownText}>{networkNames[selectedNetwork]}</Text>
            <Ionicons
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="white"
            />
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

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity>
            <Ionicons name="person" size={30} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Address Row */}
        <View style={styles.addressRow}>
          <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
            {selectedAddress}
          </Text>
          <TouchableOpacity onPress={() => copyToClipboard(selectedAddress)}>
            <Ionicons name="copy-outline" size={20} color="white" style={styles.copyIcon} />
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View style={styles.balanceContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#1A1A1A" />
          ) : balanceData ? (
            <>
              <Text style={styles.balanceText}>
                Total Balance: ${totalUsdBalance?.toFixed(2) || '0.00'} USD
              </Text>
              <Text style={styles.balanceText}>
                Native: {balanceData.nativeBalance}
              </Text>
              {balanceData.tokens.length > 0 ? (
                <View style={styles.tokenList}>
                  <Text style={styles.tokenHeader}>Tokens:</Text>
                  <ScrollView style={styles.tokenScroll} nestedScrollEnabled>
                    {balanceData.tokens.map((token, index) => (
                      <View key={index} style={styles.tokenItem}>
                        <Text style={styles.tokenText}>
                          {token.name || token.symbol || token.tokenAddress.slice(0, 8)}: {parseFloat(token.balance).toFixed(4)} {token.symbol || 'N/A'}
                        </Text>
                        <Text style={styles.tokenUsdText}>
                          ${token.usdValue ? token.usdValue.toFixed(2) : '0.00'} USD
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <Text style={styles.tokenText}>No tokens found</Text>
              )}
            </>
          ) : (
            <Text style={styles.balanceText}>Balance: Not available</Text>
          )}
        </View>
      </View>

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
    alignSelf: 'flex-start',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    width: '100%',
  },
  addressText: {
    flex: 1,
    color: '#1A1A1A',
    fontSize: 14,
    marginRight: 10,
  },
  copyIcon: {
    backgroundColor: '#1A1A1A',
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
    color: '#1A1A1A',
    marginVertical: 5,
  },
  tokenList: {
    width: '100%',
    marginTop: 10,
    maxHeight: 150, // Limit height to prevent overflow
  },
  tokenScroll: {
    flexGrow: 0,
  },
  tokenHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tokenText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  tokenUsdText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
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