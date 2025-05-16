import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/RootNavigator';
import { FontAwesome5 } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [addresses, setAddresses] = useState<{ ethereum: string; bitcoin: string; solana: string } | null>(null);
  const navigation = useNavigation<NavigationProp>();

  const createWallet = async () => {
    try {
      const response = await axios.post('http://192.168.68.110:7777/api/wallet/create');
      const { seedPhrase, addresses } = response.data;
      console.log('Wallet created:', response.data);
      setSeedPhrase(seedPhrase);
      setAddresses(addresses);
      await AsyncStorage.setItem('walletCreated', 'true');
      await AsyncStorage.setItem('walletAddresses', JSON.stringify(addresses));
    } catch (error) {
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
      console.error('Error creating wallet:', error);
    }
  };

  const handleConfirmSeedPhrase = () => {
    if (seedPhrase && addresses) {
      navigation.navigate('SeedPhraseConfirmation', { seedPhrase, addresses });
    } else {
      Alert.alert('Error', 'Wallet data is not ready. Please try creating the wallet again.');
    }
  };

  const renderSeedPhraseWord = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.seedWordContainer}>
      <Text style={styles.seedWord}>{`${index + 1}. ${item}`}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Enigma Wallet</Text>
      {!seedPhrase ? (
        <TouchableOpacity style={styles.button} onPress={createWallet}>
          <Text style={styles.buttonText}>Create Wallet</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.warningContainer}>
            <FontAwesome5 name="radiation-alt" size={30} color="red" style={{ marginBottom: 10, marginTop: 10 }} />
            <Text style={styles.warning}>
              Write down this seed phrase securely. It’s your key to recover your wallet.
            </Text>
            <Text style={styles.warning}>
              Do not share this seed phrase with anyone. It is the only way to recover your wallet.
            </Text>
            <Text style={styles.warning}>Do not screenshot it!</Text>
          </View>
          <FlatList
            data={seedPhrase.split(' ')}
            renderItem={renderSeedPhraseWord}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            contentContainerStyle={styles.seedPhraseContainer}
            scrollsToTop={true}
          />
          <TouchableOpacity style={styles.button} onPress={handleConfirmSeedPhrase}>
            <Text style={styles.buttonText}>Confirm Seed Phrase</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  warningContainer: {
    marginBottom: 20,
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 10,
    width: 'auto',
    alignSelf: 'center',
    alignItems: 'center',
    shadowColor: '#535956',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 3.84,
    elevation: 10,
  },
  warning: {
    fontSize: 16,
    color: 'red',
    textAlign: 'left',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  seedPhraseContainer: {
    marginTop: 20,
    width: 'auto',
    backgroundColor: '#444444',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#535956',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 1.2,
    elevation: 10,
    alignSelf: 'center',
  },
  seedWordContainer: {
    marginVertical: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 5,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    width: '50%',
    shadowColor: '#535956',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 3.84,
    elevation: 10,
  },
  seedWord: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold'
  },
  button: {
    backgroundColor: '#00FF83',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;