import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CoinSymbol, Candle, AIAnalysisResult, CoinState, TradeRecord } from './types';
import { fetchKlines, fetchTicker } from './services/binanceService';
import { analyzeMarket } from './services/geminiService';
import ChartComponent from './components/ChartComponent';
import AnalysisPanel from './components/AnalysisPanel';
import GlassCard from './components/GlassCard';
import WinRateStats from './components/WinRateStats';

// Available coins
const COINS: { symbol: CoinSymbol; name: string }[] = [
  { symbol: 'ETHUSDT', name: 'ETH' },
  { symbol: 'BTCUSDT', name: 'BTC' },
  { symbol: 'XRPUSDT', name: 'XRP' },
];

// Helper Component for Animated Numbers
const AnimatedValue: React.FC<{
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  format?: (val: number) => string;
}> = ({ value, className = '', prefix = '', suffix = '', format }) => {
  const prevValue = useRef(value);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (value !== prevValue.current) {
      if (value > prevValue.current) {
        setAnimationClass('animate-flash-green');
      } else if (value < prevValue.current) {
        setAnimationClass('animate-flash-red');
      }
      prevValue.current = value;
      const timer = setTimeout(() => setAnimationClass(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const displayValue = format ? format(value) : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <span className={`${className} ${animationClass} inline-block transition-transform will-change-transform origin-left`}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

const App: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<CoinSymbol>('ETHUSDT');
  const [marketState, setMarketState] = useState<CoinState>({
    symbol: 'ETHUSDT',
    price: 0,
    change24h: 0,
    data: [],
  });
  
  // Initialize analysis from localStorage to persist across reloads
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(() => {
    try {
      const saved = localStorage.getItem('currentAnalysis');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Trade History & Stats
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tradeHistory');
      // Fix: Ensure parsed result is an array. JSON.parse('null') returns null which breaks .map
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  const [showStats, setShowStats] = useState(false);

  // Persistence: Save trade history
  useEffect(() => {
    localStorage.setItem('tradeHistory', JSON.stringify(tradeHistory));
  }, [tradeHistory]);

  // Persistence: Save current analysis result
  useEffect(() => {
    if (analysis) {
      localStorage.setItem('currentAnalysis', JSON.stringify(analysis));
    }
  }, [analysis]);

  // Initial Data Load & Polling
  const fetchData = useCallback(async () => {
    try {
      const [klines, ticker] = await Promise.all([
        fetchKlines(selectedSymbol),
        fetchTicker(selectedSymbol)
      ]);

      if (klines && ticker) {
        const currentPrice = parseFloat(ticker.lastPrice);
        setMarketState({
          symbol: selectedSymbol,
          price: currentPrice,
          change24h: parseFloat(ticker.priceChangePercent),
          data: klines,
        });

        // Check active trades for expiration using real-time price
        checkActiveTrades(currentPrice, selectedSymbol);
      }
    } catch (e) {
      console.error("Failed to update data", e);
    }
  }, [selectedSymbol]);

  // Logic to verify pending trades even if they were created earlier
  const checkActiveTrades = (currentPrice: number, symbol: CoinSymbol) => {
    setTradeHistory(prev => {
      // Safety check: ensure prev is array
      if (!Array.isArray(prev)) return [];

      let hasUpdates = false;
      const now = Date.now();
      
      const updatedHistory = prev.map(trade => {
        // Only check pending trades for the current symbol that have expired
        if (trade.status === 'pending' && trade.symbol === symbol && now >= trade.endTime) {
          hasUpdates = true;
          
          let outcome: 'win' | 'loss' = 'loss';
          if (trade.direction === 'up') {
            outcome = currentPrice > trade.entryPrice ? 'win' : 'loss';
          } else {
            outcome = currentPrice < trade.entryPrice ? 'win' : 'loss';
          }

          return {
            ...trade,
            status: outcome,
            finalPrice: currentPrice
          };
        }
        return trade;
      });

      return hasUpdates ? updatedHistory : prev;
    });
  };

  useEffect(() => {
    fetchData(); 
    const interval = setInterval(fetchData, 5000); // Poll data every 5s
    return () => clearInterval(interval);
  }, [fetchData, selectedSymbol]);

  // Heartbeat to force checks on trades even if price doesn't change drastically
  useEffect(() => {
    const timer = setInterval(() => {
      if (marketState.price > 0) {
        checkActiveTrades(marketState.price, marketState.symbol);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [marketState.price, marketState.symbol]);


  // AI Analysis Handler
  const handleAnalyze = async () => {
    if (marketState.data.length === 0) return;
    
    const snapshotSymbol = selectedSymbol;
    const snapshotPrice = marketState.price;
    const snapshotData = [...marketState.data]; 
    const now = Date.now();

    setIsAnalyzing(true);
    
    try {
      const result = await analyzeMarket(snapshotSymbol, snapshotData);
      
      // Fix: Strictly check if result and required nested objects exist to prevent undefined errors
      if (result && result.trend5m && result.trend10m) {
        const enrichedResult: AIAnalysisResult = {
          ...result,
          symbol: snapshotSymbol,
          initialPrice: snapshotPrice,
          timestamp: now
        };
        
        setAnalysis(enrichedResult);

        const newTrades: TradeRecord[] = [
          {
            id: `${now}-5m`,
            timestamp: now,
            symbol: snapshotSymbol,
            type: '5m',
            direction: result.trend5m.direction === 'up' ? 'up' : 'down',
            entryPrice: snapshotPrice,
            targetPrice: result.trend5m.priceTarget,
            endTime: now + (5 * 60 * 1000),
            status: 'pending'
          },
          {
            id: `${now}-10m`,
            timestamp: now,
            symbol: snapshotSymbol,
            type: '10m',
            direction: result.trend10m.direction === 'up' ? 'up' : 'down',
            entryPrice: snapshotPrice,
            targetPrice: result.trend10m.priceTarget,
            endTime: now + (10 * 60 * 1000),
            status: 'pending'
          }
        ];

        setTradeHistory(prev => [...(Array.isArray(prev) ? prev : []), ...newTrades]);
      } else {
        console.warn("AI returned incomplete analysis data:", result);
      }
    } catch (error) {
      console.error("Analysis interrupted or failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentCoinName = COINS.find(c => c.symbol === selectedSymbol)?.name;
  
  // Calculate win rate for the minimal pill
  const completedTrades = (tradeHistory || []).filter(t => t.status !== 'pending');
  const winRate = completedTrades.length > 0 
    ? ((completedTrades.filter(t => t.status === 'win').length / completedTrades.length) * 100).toFixed(0) 
    : '-';

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900 pb-10 bg-[#f4f5f9]">
      
      {/* Dynamic Background - Lighter, cleaner */}
      <div className="fixed top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-50/80 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-50/80 blur-[100px] rounded-full pointer-events-none z-0" />

      {showStats && <WinRateStats history={tradeHistory} onClose={() => setShowStats(false)} />}

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-6 pt-4 space-y-4">
        
        {/* Minimal Floating Control Bar */}
        <div className="sticky top-4 z-50 flex justify-between items-center bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-slate-200/50 rounded-2xl p-2 px-3">
          {/* Coin Selector */}
          <div className="flex bg-slate-100/80 rounded-xl p-1 gap-1">
             {COINS.map((coin) => (
                <button
                  key={coin.symbol}
                  onClick={() => setSelectedSymbol(coin.symbol)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300
                    ${selectedSymbol === coin.symbol 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {coin.name}
                </button>
              ))}
          </div>

          {/* Ticker Info (Minimal) */}
          <div className="flex items-center gap-4 md:gap-8 border-l border-r border-slate-200 px-4 md:px-8 mx-auto hidden md:flex">
             <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Price</span>
                <AnimatedValue 
                  value={marketState.price} 
                  className="text-sm font-black text-slate-700 font-mono"
                  prefix="$"
                />
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">24H</span>
                <AnimatedValue 
                  value={marketState.change24h} 
                  className={`text-sm font-black font-mono ${marketState.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                  format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`}
                />
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Vol</span>
                <span className="text-sm font-black text-slate-700 font-mono">
                    {(marketState.data[marketState.data.length-1]?.volume || 0).toFixed(0)}
                </span>
             </div>
          </div>

          {/* Mobile Ticker (Simplified) */}
           <div className="flex flex-col items-end md:hidden mr-3">
                <AnimatedValue 
                  value={marketState.price} 
                  className="text-sm font-black text-slate-700 font-mono"
                  prefix="$"
                />
                <AnimatedValue 
                  value={marketState.change24h} 
                  className={`text-[10px] font-bold ${marketState.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                  format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`}
                />
           </div>

          {/* Stats Button */}
          <button 
            onClick={() => setShowStats(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
             <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Win Rate</span>
                <span className="text-xs font-black">{winRate}%</span>
             </div>
          </button>
        </div>

        {/* Main Chart Section */}
        <section className="w-full pt-2">
            <ChartComponent 
               data={marketState.data} 
               symbol={currentCoinName || ''} 
               analysis={analysis} 
            />
        </section>

        {/* AI Analysis Section */}
        <section className="pb-8">
           <AnalysisPanel 
             analysis={analysis} 
             loading={isAnalyzing} 
             onAnalyze={handleAnalyze} 
           />
        </section>
        
      </div>
    </div>
  );
};

export default App;