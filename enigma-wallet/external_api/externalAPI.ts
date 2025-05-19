import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap_rank: number;
}

export interface CoinDetails {
  id: string;
  symbol: string;
  name: string;
  image: {
    large: string;
  };
  market_data: {
    current_price: {
      usd: number;
    };
    price_change_percentage_24h: number;
    market_cap: {
      usd: number;
    };
    total_volume: {
      usd: number;
    };
    circulating_supply: number;
    total_supply: number | null;
    ath: {
      usd: number;
    };
    atl: {
      usd: number;
    };
  };
  description: {
    en: string;
  };
  links: {
    homepage: string[];
    twitter_screen_name: string;
  };
}

/**
 * Fetches market data for the top 250 coins by market cap.
 */
export const getMarketData = async (): Promise<CryptoAsset[]> => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 250,
        page: 1,
        sparkline: false,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
};

/**
 * Fetches IDs of trending coins.
 */
export const getTrendingCoins = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/search/trending`);
    return response.data.coins.map((coin: any) => coin.item.id);
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    return [];
  }
};

/**
 * Fetches coin prices by their IDs for the Coin Finder feature.
 */
export const getCoinPrices = async (ids: string[]): Promise<{ [key: string]: { usd: number } }> => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids: ids.join(','),
        vs_currencies: 'usd',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching coin prices:', error);
    return {};
  }
};

/**
 * Fetches detailed data for a specific coin by its ID.
 */
export const getCoinDetails = async (id: string): Promise<CoinDetails | null> => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for coin ${id}:`, error);
    return null;
  }
};