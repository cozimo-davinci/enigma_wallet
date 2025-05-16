import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SwapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Swap Tokens</Text>
      <Text style={styles.subtitle}>Select tokens to swap</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    color: '#00A3FF',
    fontSize: 16,
  },
});