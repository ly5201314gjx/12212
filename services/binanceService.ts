import { Candle, CoinSymbol } from '../types';

const BASE_URL = 'https://api.binance.com/api/v3';

export const fetchKlines = async (symbol: CoinSymbol, interval: string = '1m', limit: number = 100): Promise<Candle[]> => {
  try {
    const response = await fetch(`${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch klines');
    }
    const data = await response.json();
    
    // Fix: Ensure data is an array before mapping. Binance might return an error object.
    if (!Array.isArray(data)) {
        console.warn("Binance API returned non-array data:", data);
        return [];
    }

    // Binance returns array of arrays. Index 0: open time, 1: open, 2: high, 3: low, 4: close, 5: volume
    return data.map((d: any) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  } catch (error) {
    console.error("Error fetching binance klines:", error);
    return [];
  }
};

export const fetchTicker = async (symbol: CoinSymbol) => {
  try {
    const response = await fetch(`${BASE_URL}/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch ticker');
    return await response.json();
  } catch (error) {
    console.error("Error fetching ticker:", error);
    return null;
  }
};