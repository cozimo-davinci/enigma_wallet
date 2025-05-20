import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BalanceCard from '../components/BalanceCard/BalanceCard';
import CryptoAssetsPrices from '../components/CryptoAssets/CryptoAssetsPrices';
import Toast from 'react-native-toast-message';

export default function WalletScreen() {
  const scrollViewRef = useRef<ScrollView>(null);

  const handlePageChange = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const clearAsyncStorage = async () => {
    try {
      await AsyncStorage.clear();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'AsyncStorage cleared. Restart the app to reset the onboarding flow.',
        text1Style: { fontSize: 18, fontWeight: 'bold' },
        text2Style: { fontSize: 16 },
        position: 'top',
        visibilityTime: 4000,
      });
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to clear AsyncStorage.',
        text1Style: { fontSize: 18, fontWeight: 'bold' },
        text2Style: { fontSize: 16 },
        position: 'top',
        visibilityTime: 4000,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentWrapper}>
          <BalanceCard />
          <CryptoAssetsPrices onPageChange={handlePageChange} />
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
});