import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image } from 'react-native';

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

interface TokenListInWalletProps {
  balanceData: BalanceResponse | null;
  loading: boolean;
}

const TokenListInWallet = ({ balanceData, loading }: TokenListInWalletProps) => {
  if (loading) {
    return <ActivityIndicator size="large" color="#1A1A1A" style={styles.loading} />;
  }

  if (!balanceData || balanceData.tokens.length === 0) {
    return (
      <View style={styles.tokenListCard}>
        <Text style={styles.tokenText}>No tokens found</Text>
      </View>
    );
  }

  return (
    <View style={styles.tokenListCard}>
      <Text style={styles.tokenHeader}>Tokens</Text>
      {balanceData.tokens.map((token, index) => {
        const formattedPrice = token.price
          ? token.price < 1
            ? `$${token.price.toFixed(6)}`
            : `$${token.price.toLocaleString()}`
          : '$0.00';
        const formattedChange = token.change !== undefined ? token.change.toFixed(2) : '0.00';

        return (
          <TouchableOpacity
            key={index}
            style={styles.tokenButton}
            onPress={() => console.log(`Selected token: ${token.name || token.symbol}`)}
          >
            {token.logo && (
              <View style={styles.logoContainer}>
                <Image source={{ uri: token.logo }} style={styles.logoImage} />
              </View>
            )}
            <View style={styles.nameAndChangeContainer}>
              <Text style={styles.tokenName}>{token.name || token.symbol || token.tokenAddress.slice(0, 8)}</Text>
              <Text
                style={[
                  styles.changeText,
                  { color: token.change && token.change >= 0 ? '#00FF83' : '#FF4444' },
                ]}
              >
                {token.change && token.change >= 0 ? '+' : ''}{formattedChange}%
              </Text>
            </View>
            <View style={styles.quantityAndPriceContainer}>
              <Text style={styles.tokenQuantity}>{parseFloat(token.balance).toFixed(4)} {token.symbol || 'N/A'}</Text>
              <Text style={styles.tokenPrice}>{formattedPrice}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TokenListInWallet;

const styles = StyleSheet.create({
  tokenListCard: {
    backgroundColor: '#00FF83',
    borderWidth: 2,
    borderRadius: 20,
    borderColor: '#1A1A1A',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    width: '100%',
    alignSelf: 'center',
    marginTop: 15,
  },
  tokenHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
    alignSelf: 'center',
  },
  tokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: '#1A1A1A',
    marginVertical: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.65,
    shadowRadius: 3.84,
    elevation: 5,
    shadowColor: '#000',
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
  nameAndChangeContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  quantityAndPriceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tokenText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  tokenQuantity: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  tokenPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  loading: {
    marginVertical: 10,
  },
});