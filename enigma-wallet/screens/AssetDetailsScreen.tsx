import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';

type CryptoDetailsScreenRouteProp = RouteProp<RootStackParamList, 'CryptoDetails'>;

interface AssetsProps {
  route: CryptoDetailsScreenRouteProp;
}

const AssetDetailsScreen = ({ route }: AssetsProps) => {
  const { assetId, assetName } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details for {assetName}</Text>
      <Text style={styles.subtitle}>Asset ID: {assetId}</Text>
    </View>
  );
};

export default AssetDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#00FF83',
    fontSize: 16,
  },
});