import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Modal from 'react-native-modal';
import { IP_ADDRESS } from '../constants/constants';

interface Profile {
  username: string;
  email: string;
  profilePicture: string | null; // Signed URL or null
}

const ProfileDetails = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await axios.get(`http://${IP_ADDRESS}:7777/api/profile/profileDetails`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        setProfile(response.data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch profile';
        console.error('Fetch profile error:', err.response?.data, err.message);
        setError(errorMessage);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Request permissions for camera and photo library
  const requestPermissions = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!cameraPermission.granted || !libraryPermission.granted) {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Camera and photo library access are required',
        });
        return false;
      }
      return true;
    } catch (err: any) {
      console.error('Permission request error:', err.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to request permissions',
      });
      return false;
    }
  };

  // Handle profile picture update
  const handleUpdateProfilePicture = () => {
    console.log('Opening modal');
    setModalVisible(true);
  };

  // Pick image from camera or gallery
  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      console.log(`Launching ${source} picker`);
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setModalVisible(false);
        return;
      }

      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      }

      console.log('Image picker result:', result);

      // Close modal only after image picker completes
      setModalVisible(false);

      if (!result.canceled) {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const asset = result.assets[0];
        // Determine file extension based on URI or fallback
        const isPng = asset.uri.toLowerCase().endsWith('.png');
        const extension = isPng ? 'png' : 'jpg';
        const mimeType = isPng ? 'image/png' : 'image/jpeg';

        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: `profile.${extension}`,
          type: mimeType,
        } as any);

        console.log('Uploading image:', {
          uri: asset.uri,
          size: asset.fileSize || 'unknown',
          type: mimeType,
        });

        const response = await axios.post(`http://${IP_ADDRESS}:7777/api/profile/profileDetails`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        setProfile((prev) => ({
          ...prev!,
          profilePicture: response.data.profilePicture,
        }));
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile picture updated',
        });
      } else {
        console.log('Image picker cancelled');
      }
    } catch (err: any) {
      console.error('Pick image error:', {
        message: err.message,
        stack: err.stack,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update profile picture';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Profile</Text>
      <View style={styles.profileCard}>
      {loading ? (
        <ActivityIndicator size="large" color="#00FF83" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : profile ? (
        <>
          {profile.profilePicture ? (
            <Image
              source={{ uri: profile.profilePicture }}
              style={styles.profilePicture}
            />
          ) : (
            <Ionicons
              name="person-circle-outline"
              size={100}
              color="#FFF"
              style={{ marginBottom: 20 , 
                backgroundColor: '#2A2A2A', borderRadius: 18}}
            />
          )}
          <TouchableOpacity
            onPress={handleUpdateProfilePicture}
            style={styles.updateButton}
          >
            <Text style={styles.updateButtonText}>Update Profile Picture</Text>
          </TouchableOpacity>
          <View style={styles.dataContainer}>
            <TouchableOpacity>
              <Text style={styles.text}>Username: {profile.username}</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.text}>Email: {profile.email}</Text>
            </TouchableOpacity>
            
          </View>
          
        </>
      ) : (
        <Text style={styles.text}>No profile data available</Text>
      )}
      </View>

      {/* Modal for image source selection */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Image Source</Text>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => pickImage('camera')}
            >
              <Ionicons name="camera-outline" size={40} color="#FFF" />
              <Text style={styles.modalButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => pickImage('gallery')}
            >
              <Ionicons name="images-outline" size={40} color="#FFF" />
              <Text style={styles.modalButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    // justifyContent: 'center',
  },
  mainTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  profileCard: {
    backgroundColor: '#00FF83',
    borderWidth: 2,
    borderRadius: 20,
    borderColor: '#1A1A1A',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    width: '100%',
    marginTop: 15,
    alignItems: 'center',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    backgroundColor: '#2A2A2A',
    
  },
  dataContainer: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 5,
    width: '100%',
    marginBottom: 20,
    
  },
  text: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '800'
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20
  },
  updateButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#2A2A2A',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  modalButton: {
    alignItems: 'center',
    padding: 10,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 5,
  },
  cancelButton: {
    padding: 10,
  },
  cancelButtonText: {
    color: '#00FF83',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileDetails;