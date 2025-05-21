import React from 'react';
import { StyleSheet, SafeAreaView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import RootNavigator from './navigation/RootNavigator';
import Toast from 'react-native-toast-message';

// Enable react-native-screens for better performance (Expo Go compatible)
enableScreens();
const toastConfig = {
  success: ({ text1, text2, props }: any) => (
    <View style={{
      width: '90%',
      backgroundColor: '#171716',
      padding: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#00FF83',
      marginTop: 40,
    }}>
      <Text style={{
        fontSize: props.text1Style?.fontSize || 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 5,
      }}>
        {text1}
      </Text>
      <Text style={{
        fontSize: props.text2Style?.fontSize || 16,
        color: '#FFF',
        flexWrap: 'wrap',
      }}>
        {text2}
      </Text>
    </View>
  ),
  error: ({ text1, text2, props }: any) => (
    <View style={{
      width: '90%',
      backgroundColor: '#171716',
      padding: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#FF4444',
      marginTop: 40,
    }}>
      <Text style={{
        fontSize: props.text1Style?.fontSize || 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 5,
      }}>
        {text1}
      </Text>
      <Text style={{
        fontSize: props.text2Style?.fontSize || 16,
        color: '#FFF',
        flexWrap: 'wrap',
      }}>
        {text2}
      </Text>
    </View>
  ),
  info: ({ text1, text2, props }: any) => (
    <View style={{
      width: '90%',
      backgroundColor: '#171716',
      padding: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#00FFFF',
      marginTop: 40,
    }}>
      <Text style={{
        fontSize: props.text1Style?.fontSize || 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 5,
      }}>
        {text1}
      </Text>
      <Text style={{
        fontSize: props.text2Style?.fontSize || 16,
        color: '#FFF',
        flexWrap: 'wrap',
      }}>
        {text2}
      </Text>
    </View>
  ),
};
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <RootNavigator />
      <Toast config={toastConfig} />
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