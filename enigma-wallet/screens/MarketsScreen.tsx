import React, {useRef} from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CryptoAssetsPrices from '../components/CryptoAssets/CryptoAssetsPrices';

export default function MarketsScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  
  const handlePageChange = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  
  return (
    
    <SafeAreaView style={styles.container}>
      <ScrollView
      ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
          <CryptoAssetsPrices onPageChange={handlePageChange} />
        
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
  
});