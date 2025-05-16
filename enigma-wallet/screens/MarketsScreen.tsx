import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MarketsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send / Receive</Text>
      <Text style={styles.subtitle}>Scan or enter address</Text>
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