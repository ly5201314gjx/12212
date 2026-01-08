export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type CoinSymbol = 'BTCUSDT' | 'ETHUSDT' | 'XRPUSDT';

export interface DimensionAnalysis {
  name: string;
  score: number; // 0-100
  insight: string;
  status: 'positive' | 'negative' | 'neutral';
}

export interface HistoricalMatch {
  period: string; // e.g. "2021 May"
  similarity: number;
  outcome: string;
}

export interface SimilarityAnalysis {
  matchedPattern: string;
  similarityScore: number; // 0-100%
  curvatureComparison: string;
  historicalOutcome: 'Bullish' | 'Bearish' | 'Choppy';
  patternDuration: string; // e.g. "45m"
  volumeCorrelation: number; // 0-100
  keyLevel: string; // Support/Resistance level found in pattern
  
  // New detailed fields
  volatilityMatch: number; // 0-100
  trendCorrelation: number; // 0-100
  historicalMatches: HistoricalMatch[]; // Top 3 specific historical dates/periods
}

export interface AIAnalysisResult {
  // Runtime injected fields
  symbol?: string; // Track which coin this analysis is for
  initialPrice?: number;
  timestamp?: number; // The time the analysis was generated
  
  actionSignal: 'BUY' | 'SELL'; // Strict BUY or SELL
  trend5m: {
    direction: 'up' | 'down' | 'flat';
    priceTarget: number;
    confidence: number;
    reasoning: string;
  };
  trend10m: {
    direction: 'up' | 'down' | 'flat';
    priceTarget: number;
    confidence: number;
    reasoning: string;
  };
  dimensions: DimensionAnalysis[];
  similarity: SimilarityAnalysis;
  summary: string;
}

export interface CoinState {
  symbol: CoinSymbol;
  price: number;
  change24h: number;
  data: Candle[];
}

// For persistent history and win rate calculation
export interface TradeRecord {
  id: string;
  timestamp: number;
  symbol: CoinSymbol;
  type: '5m' | '10m';
  direction: 'up' | 'down';
  entryPrice: number;
  targetPrice: number;
  endTime: number;
  status: 'pending' | 'win' | 'loss';
  finalPrice?: number;
}