import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StakeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stake Assets</Text>
      <Text style={styles.subtitle}>0 ETH staked (Placeholder)</Text>
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