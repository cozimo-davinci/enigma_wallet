import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  iconName: string;
  title: string;
  onPress: () => void;
}

const BalanceCard = () => {
  const buttons: ButtonProps[] = [
    { iconName: 'add', title: 'Deposit', onPress: () => console.log('Deposit pressed') },
    { iconName: 'cash', title: 'Earn', onPress: () => console.log('Earn pressed') },
    { iconName: 'share-social', title: 'Referral', onPress: () => console.log('Referral pressed') },
  ];

  // Mock data for the card (replace with real data if available)
  const token = {
    logo: 'logo-bitcoin', // Placeholder Ionicons name, replace with actual token icon
    name: 'Bitcoin',
    price: 103000,
    change: 115.5,
    pnl: 112,
    balance: 152.687,
  };

  const renderChart = () => {
    return (
      <View style={styles.chartContainer}>
        {/* Simple line representation using View borders */}
        <View style={styles.chartLine} />
      </View>
    );
  };

  return (
    <View>
      <View style={styles.balanceCard}>
        {/* Top-left avatar */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity>
          <Ionicons name="person" size={30} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Bitcoin logo, name, and price */}
        <View style={styles.mainSection}>
          <View style={styles.tokenRow}>
            <View style={styles.iconContainer}>
              <Ionicons name={token.logo as any} size={24} color="#00FF83" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.tokenName}>{token.name}</Text>
              <Text style={styles.priceText}>${token.price.toLocaleString()}</Text>
            </View>
          </View>

          {/* PNL and Balance column */}
          <View style={styles.statsColumn}>
            <Text style={styles.changeText}>PNL: {token.pnl}%</Text>
            <Text style={styles.changeText}>Balance: ${token.balance.toLocaleString()}</Text>
          </View>
        </View>

        {/* Right section with change and chart */}
        <View style={styles.rightSection}>
          <Text style={[styles.changeText, { color: '#00FF83' }]}>+{token.change}%</Text>
          {renderChart()}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {buttons.map((button, index) => (
          <TouchableOpacity key={index} style={styles.buttonCard} onPress={button.onPress}>
            <View style={styles.iconContainer}>
              <Ionicons name={button.iconName as any} size={24} color="#00FF83" />
            </View>
            <Text style={styles.buttonText}>{button.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default BalanceCard;

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: '#00FF83',
    borderWidth: 2,
    borderRadius: 20,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 20,
    margin: 10,
    width: '100%',
    height: 180,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b403d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: -3,
    marginTop: -10
  },
  mainSection: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 40
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: '#3b403d',
  },
  textContainer: {
    marginLeft: 10,
  },
  tokenName: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsColumn: {
    flexDirection: 'column',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  changeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  chartContainer: {
    width: 80,
    height: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 1,
    position: 'absolute',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    transform: [{ rotate: '10deg' }, { translateX: 20 }],
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  buttonCard: {
    backgroundColor: '#161716',
    borderWidth: 2,
    borderRadius: 15,
    borderColor: '#1A1A1A',
    padding: 10,
    width: '28%',
    alignItems: 'center',
    shadowColor: '#535956',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
});