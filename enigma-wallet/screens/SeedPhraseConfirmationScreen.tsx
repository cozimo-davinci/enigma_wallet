import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'SeedPhraseConfirmation'>;

const SeedPhraseConfirmationScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { seedPhrase, addresses } = route.params as { seedPhrase: string; addresses: { ethereum: string; bitcoin: string; solana: string } };
  const originalWords = seedPhrase.split(' ');
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = [...originalWords].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
  }, []);

  const handleWordSelect = (word: string) => {
    setSelectedWords([...selectedWords, word]);
    setShuffledWords(shuffledWords.filter((w) => w !== word));
  };

  const handleWordRemove = (word: string) => {
    setSelectedWords(selectedWords.filter((w) => w !== word));
    setShuffledWords([...shuffledWords, word]);
  };

  const handleConfirm = () => {
    if (selectedWords.join(' ') === seedPhrase) {
      navigation.navigate('Main');
    } else {
      Alert.alert('Error', 'Seed phrase is incorrect. Please try again.');
      setSelectedWords([]);
      setShuffledWords([...originalWords].sort(() => Math.random() - 0.5));
    }
  };

  const renderWord = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.wordContainer} onPress={() => handleWordSelect(item)}>
      <Text style={styles.word}>{item}</Text>
    </TouchableOpacity>
  );

  const renderSelectedWord = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity style={styles.selectedWordContainer} onPress={() => handleWordRemove(item)}>
      <Text style={styles.word}>{`${index + 1}. ${item}`}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Your Seed Phrase</Text>
      <Text style={styles.instructions}>Select the words in the correct order.</Text>
      <FlatList
        data={selectedWords}
        renderItem={renderSelectedWord}
        numColumns={3}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.selectedWordsGrid}
        style={{ width: '100%' }}
      />
      <FlatList
        data={shuffledWords}
        renderItem={renderWord}
        keyExtractor={(item) => item}
        numColumns={3}
        contentContainerStyle={styles.wordGrid}
        style={{ width: '100%' }}
      />
      <TouchableOpacity
        style={[styles.button, { opacity: selectedWords.length !== 12 ? 0.5 : 1 }]}
        onPress={handleConfirm}
        disabled={selectedWords.length !== 12}
      >
        <Text style={styles.buttonText}>Confirm</Text>
      </TouchableOpacity>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectedWordsGrid: {
    marginBottom: 20,
    backgroundColor: '#444444',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#535956',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 3.84,
    elevation: 10,
  },
  wordGrid: {
    marginBottom: 20,
    backgroundColor: '#444444',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#535956',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 3.84,
    elevation: 10,
  },
  wordContainer: {
    flex: 1,
    margin: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 5,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  selectedWordContainer: {
    flex: 1,
    margin: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#00FF83',
    borderRadius: 5,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  word: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#00FF83',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SeedPhraseConfirmationScreen;