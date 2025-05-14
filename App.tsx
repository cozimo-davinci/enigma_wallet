import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import RootNavigator from './navigation/RootNavigator';

// Enable react-native-screens for better performance (Expo Go compatible)
enableScreens();

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <RootNavigator />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Match navigator's dark theme
  },
});