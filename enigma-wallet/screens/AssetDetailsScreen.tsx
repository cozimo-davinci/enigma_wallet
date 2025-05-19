import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { getCoinDetails, CoinDetails } from '../external_api/externalAPI';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type CryptoDetailsScreenRouteProp = RouteProp<RootStackParamList, 'CryptoDetails'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'CryptoDetails'>;

interface AssetsProps {
  route: CryptoDetailsScreenRouteProp;
}

const AssetDetailsScreen = ({ route }: AssetsProps) => {
  const { assetId, assetName } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [coinDetails, setCoinDetails] = useState<CoinDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const fetchCoinDetails = async () => {
      setLoading(true);
      const data = await getCoinDetails(assetId);
      if (data) {
        setCoinDetails(data);
      } else {
        setError('Failed to fetch coin details');
      }
      setLoading(false);
    };
    fetchCoinDetails();
  }, [assetId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  const { image, symbol, market_data, description, links } = coinDetails!;

  const truncateDescription = (desc: string, length: number) => {
    return desc.length > length ? desc.substring(0, length) + '...' : desc;
  };

  const descriptionText = description.en || 'No description available.';
  const isLongDescription = description.en && description.en.length > 200;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back-circle-sharp" size={55} color="#00FF83" />
      </TouchableOpacity>
      <View style={styles.card}>
        <View style={styles.header}>
          <Image source={{ uri: image.large }} style={styles.logo} />
          <Text style={styles.name}>
            {assetName} ({symbol.toUpperCase()})
          </Text>
        </View>
        <View style={styles.priceSection}>
          <Text style={styles.price}>${market_data.current_price.usd.toLocaleString()}</Text>
          <Text
            style={[
              styles.change,
              { color: market_data.price_change_percentage_24h >= 0 ? '#00FF83' : '#FF4444' },
            ]}
          >
            {market_data.price_change_percentage_24h.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.statsSection}>
          <Text style={styles.stat}>
            Market Cap: ${market_data.market_cap.usd.toLocaleString()}
          </Text>
          <Text style={styles.stat}>
            Volume (24h): ${market_data.total_volume.usd.toLocaleString()}
          </Text>
          <Text style={styles.stat}>
            Circulating Supply: {market_data.circulating_supply.toLocaleString()}
          </Text>
          <Text style={styles.stat}>
            Total Supply: {market_data.total_supply ? market_data.total_supply.toLocaleString() : 'N/A'}
          </Text>
        </View>
        <View style={styles.historySection}>
          <Text style={styles.stat}>
            All-Time High: ${market_data.ath.usd.toLocaleString()}
          </Text>
          <Text style={styles.stat}>
            All-Time Low: ${market_data.atl.usd.toLocaleString()}
          </Text>
        </View>
        <View style={styles.descriptionSection}>
          <Text style={styles.description}>
            {isLongDescription && !showFullDescription
              ? truncateDescription(description.en, 200)
              : descriptionText}
          </Text>
          {isLongDescription && (
            <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
              <Text style={styles.readMore}>
                {showFullDescription ? 'Read Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.linksSection}>
          <Text style={styles.linksTitle}>Links:</Text>
          <View style={styles.linksContainer}>
            {links.homepage[0] && (
              <TouchableOpacity
                style={styles.linkItem}
                onPress={() => Linking.openURL(links.homepage[0])}
              >
                <Ionicons name="globe-outline" size={20} color="#00FF83" style={styles.linkIcon} />
                <Text style={styles.link}>Website</Text>
              </TouchableOpacity>
            )}
            {links.twitter_screen_name && (
              <TouchableOpacity
                style={styles.linkItem}
                onPress={() => Linking.openURL(`https://twitter.com/${links.twitter_screen_name}`)}
              >
                <Ionicons name="logo-twitter" size={20} color="#00FF83" style={styles.linkIcon} />
                <Text style={styles.link}>Twitter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 20,
  },
  backButton: {
    marginBottom: 10,
    zIndex: 1, // Ensure button is above other content
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderRadius: 15,
    borderColor: '#1A1A1A',
    padding: 15,
    marginVertical: 5,
    shadowColor: '#535956',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 18,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  name: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  price: {
    color: '#FFF',
    fontSize: 20,
  },
  change: {
    fontSize: 20,
  },
  statsSection: {
    marginBottom: 15,
  },
  stat: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 5,
  },
  historySection: {
    marginBottom: 15,
  },
  descriptionSection: {
  },
  description: {
    color: '#FFF',
    fontSize: 14,
  },
  readMore: {
    color: '#00FF83',
    marginTop: 5,
  },
  linksSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linksTitle: {
    color: '#FFF',
    fontSize: 18,
    marginRight: 10,
  },
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  linkIcon: {
    marginRight: 5,
  },
  link: {
    color: '#00FF83',
    fontSize: 16,
  },
});

export default AssetDetailsScreen;