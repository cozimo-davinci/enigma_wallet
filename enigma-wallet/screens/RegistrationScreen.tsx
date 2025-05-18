import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Registration'>;

const RegistrationScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://192.168.68.110:7777/api/register', {
        email,
        username,
        password,
      });
      Toast.show({
        type: 'success',
        text1: 'Registration Successful',
        text2: 'Please check your email to confirm your account, then log in.',
        text1Style: { fontSize: 18, fontWeight: 'bold' },
        text2Style: { fontSize: 16 },
        position: 'top',
        visibilityTime: 4000,
      });
      navigation.navigate('Login');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.response?.data?.error || 'Something went wrong',
        text1Style: { fontSize: 18, fontWeight: 'bold' },
        text2Style: { fontSize: 16 },
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Your Account</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#888"
            keyboardAppearance="dark"
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholderTextColor="#888"
            keyboardType="twitter"
            keyboardAppearance="dark"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#888"
              keyboardType="visible-password"
              keyboardAppearance="dark"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={24}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.alreadyContainer} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { opacity: loading ? 0.5 : 1 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
    marginTop: 15,
    backgroundColor: '#171716',
    borderRadius: 10,
    padding: 25,
    borderWidth: 1,
    borderColor: '#00FF83',
    shadowColor: '#00FF83',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    flex: 0.1,
    flexDirection: 'column',
    gap: 16,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    borderRadius: 10,
    fontWeight: '700',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 50, // Space for eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: '45%',
    transform: [{ translateY: -12 }], // Center vertically (half of icon size)
  },
  alreadyContainer: {
    marginBottom: 20,
    marginTop: 15,
  },
  button: {
    backgroundColor: '#00FF83',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#00FF83',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegistrationScreen;