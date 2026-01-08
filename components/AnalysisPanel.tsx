import React, { useState, useEffect } from 'react';
import { AIAnalysisResult } from '../types';
import GlassCard from './GlassCard';

interface AnalysisPanelProps {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  onAnalyze: () => void;
}

// Compact pill for scores
const ScorePill: React.FC<{ score: number }> = ({ score }) => {
  let color = 'bg-slate-200 text-slate-600';
  if (score >= 70) color = 'bg-emerald-100 text-emerald-700';
  else if (score <= 30) color = 'bg-rose-100 text-rose-700';
  else color = 'bg-blue-100 text-blue-700';

  return (
    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${color}`}>
      {score}
    </span>
  );
};

const DimensionRow: React.FC<{ name: string; score: number; insight: string }> = ({ name, score, insight }) => {
  return (
    <div className="flex flex-col gap-1 p-2 bg-white/40 rounded-xl border border-white/50 transition-all duration-300 hover:bg-white/80 hover:border-indigo-200 hover:shadow-md hover:scale-[1.02] cursor-default group">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold text-slate-600 truncate max-w-[70%] group-hover:text-indigo-600 transition-colors">{name}</span>
        <ScorePill score={score} />
      </div>
      <div className="w-full bg-slate-100/50 rounded-full h-1 mt-0.5 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${score > 50 ? 'bg-indigo-400 group-hover:bg-indigo-500' : 'bg-slate-400 group-hover:bg-slate-500'}`} 
          style={{ width: `${score}%` }} 
        />
      </div>
      <p className="text-[9px] text-slate-400 leading-tight truncate group-hover:text-slate-600 transition-colors">{insight}</p>
    </div>
  );
};

// Independent Countdown Component
const TradeCountdown: React.FC<{ durationLabel: string; endTime: number }> = ({ durationLabel, endTime }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const totalDuration = durationLabel === '5M' ? 5 * 60 : 10 * 60; // seconds

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(0);
      return;
    }
    const update = () => {
      const now = Date.now();
      const diff = Math.ceil((endTime - now) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const percent = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));

  return (
    <div className="bg-white/60 rounded-xl p-2.5 border border-white/70 shadow-sm flex flex-col gap-1.5 transition-all hover:bg-white hover:shadow-md">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 rounded">{durationLabel}</span>
        <span className={`text-xs font-mono font-bold ${timeLeft > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
          {timeLeft > 0 ? formatTime(timeLeft) : '已结束'}
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1">
        <div 
          className="bg-indigo-500 h-1 rounded-full transition-all duration-1000" 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, loading, onAnalyze }) => {
  // Determine Signal Styles
  const signalColor = analysis?.actionSignal === 'BUY' ? 'text-emerald-500' : analysis?.actionSignal === 'SELL' ? 'text-rose-500' : 'text-slate-500';
  const signalBg = analysis?.actionSignal === 'BUY' ? 'bg-emerald-50 shadow-emerald-100' : analysis?.actionSignal === 'SELL' ? 'bg-rose-50 shadow-rose-100' : 'bg-slate-50 shadow-slate-100';
  const signalBorder = analysis?.actionSignal === 'BUY' ? 'border-emerald-100' : analysis?.actionSignal === 'SELL' ? 'border-rose-100' : 'border-slate-100';

  // Calculate timestamps based on when analysis was created
  const baseTime = analysis?.timestamp || 0;
  const time5m = baseTime + 5 * 60 * 1000;
  const time10m = baseTime + 10 * 60 * 1000;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 h-full">
      
      {/* --- Column 1: Compact Decision Engine --- */}
      <GlassCard className="p-3 md:p-4 col-span-1 flex flex-col gap-3 relative overflow-hidden h-full min-h-[300px] hover:shadow-lg hover:shadow-slate-200/50 transition-shadow duration-500">
        {/* Header */}
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <div className="flex flex-col leading-none">
               <h3 className="text-sm font-bold text-slate-700">AI 决策引擎</h3>
               {analysis?.symbol && (
                 <span className="text-[9px] text-slate-400 font-mono mt-0.5">{analysis.symbol} 正在进行中</span>
               )}
            </div>
          </div>
          <button 
            onClick={onAnalyze}
            disabled={loading}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95
              ${loading ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            {loading ? '...' : '刷新'}
          </button>
        </div>

        {analysis ? (
          <>
            {/* Main Signal Card */}
            <div className={`flex-1 rounded-2xl p-4 flex flex-col items-center justify-center text-center border ${signalBg} ${signalBorder} shadow-inner transition-all duration-500`}>
              <div className="text-[9px] md:text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">建议操作</div>
              <div className={`text-4xl md:text-5xl font-black tracking-tighter mb-2 scale-100 hover:scale-105 transition-transform ${signalColor}`}>
                {analysis.actionSignal}
              </div>
              <div className="flex gap-2 justify-center w-full">
                 <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/60 border border-slate-100 text-slate-600`}>
                    In: ${analysis.initialPrice?.toFixed(2)}
                 </div>
              </div>
            </div>

            {/* Simultaneous Countdowns */}
            <div className="grid grid-cols-2 gap-2">
              <TradeCountdown durationLabel="5M" endTime={time5m} />
              <TradeCountdown durationLabel="10M" endTime={time10m} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
             <div className="w-10 h-10 rounded-full bg-slate-300 animate-pulse mb-2"></div>
             <p className="text-xs font-medium">等待分析指令</p>
          </div>
        )}
      </GlassCard>

      {/* --- Column 2: 8 Dimensions (Grid Layout) --- */}
      <GlassCard className="p-0 col-span-1 flex flex-col h-full min-h-[300px] relative overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 transition-shadow duration-500">
        <div className="p-3 md:p-4 border-b border-slate-100/50 bg-white/40 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
           <h3 className="text-sm font-bold text-slate-700">8维全息分析</h3>
           <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Scoring</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 md:p-4 custom-scrollbar">
          {analysis ? (
            <div className="grid grid-cols-2 gap-2">
              {analysis.dimensions.map((dim, idx) => (
                <DimensionRow key={idx} name={dim.name} score={dim.score} insight={dim.insight} />
              ))}
              <div className="col-span-2 mt-2 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <p className="text-[10px] text-indigo-800 leading-relaxed font-medium">
                  "{analysis.summary}"
                </p>
              </div>
            </div>
          ) : (
             <div className="grid grid-cols-2 gap-2 opacity-30">
               {[...Array(8)].map((_,i) => <div key={i} className="h-10 bg-slate-200 rounded-xl"></div>)}
             </div>
          )}
        </div>
      </GlassCard>

      {/* --- Column 3: Rich Similarity Analysis --- */}
      <GlassCard className="p-3 md:p-4 col-span-1 flex flex-col gap-3 h-full min-h-[300px] hover:shadow-lg hover:shadow-slate-200/50 transition-shadow duration-500">
         <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700">K线形态指纹</h3>
            {analysis && (
              <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 rounded truncate max-w-[100px]">{analysis.similarity.matchedPattern}</span>
            )}
         </div>

         {analysis ? (
           <div className="flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar pr-1">
             
             {/* Key Metrics Grid */}
             <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-center transition-all hover:bg-emerald-50 hover:border-emerald-100">
                   <div className="text-[9px] text-slate-400">形态相似度</div>
                   <div className="text-xs font-bold text-emerald-600">{analysis.similarity.similarityScore}%</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-center transition-all hover:bg-blue-50 hover:border-blue-100">
                   <div className="text-[9px] text-slate-400">成交量匹配</div>
                   <div className="text-xs font-bold text-blue-600">{analysis.similarity.volumeCorrelation}%</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-center transition-all hover:bg-purple-50 hover:border-purple-100">
                   <div className="text-[9px] text-slate-400">趋势相关性</div>
                   <div className="text-xs font-bold text-purple-600">{analysis.similarity.trendCorrelation}%</div>
                </div>
             </div>

             {/* Historical Matches List (Expanded to Top 5) */}
             <div className="bg-white/50 rounded-xl p-3 border border-slate-100 flex-1">
                <div className="flex justify-between items-center mb-2">
                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">历史数据回测匹配 (Top 5)</div>
                   <span className="text-[9px] text-slate-400 bg-white px-1.5 rounded-full border border-slate-100">Deep Search</span>
                </div>
                <div className="space-y-1.5">
                   {analysis.similarity.historicalMatches?.slice(0, 5).map((match, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] p-1.5 rounded hover:bg-white transition-colors">
                         <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-500 font-bold">{idx+1}</span>
                            <span className="text-slate-700 font-medium">{match.period}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-slate-400">{match.similarity}% 吻合</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${match.outcome.includes('Bullish') || match.outcome.includes('涨') || match.outcome.includes('Buy') ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                               {match.outcome}
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Footer Info */}
             <div className="mt-auto grid grid-cols-2 gap-2">
                 <div className="px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[9px] text-slate-400">关键支撑/阻力</div>
                    <div className="text-[10px] font-medium text-slate-700 truncate">{analysis.similarity.keyLevel}</div>
                 </div>
                 <div className="px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[9px] text-slate-400">形态周期</div>
                    <div className="text-[10px] font-medium text-slate-700">{analysis.similarity.patternDuration}</div>
                 </div>
             </div>
           </div>
         ) : (
           <div className="flex-1 flex items-center justify-center opacity-30">
              <span className="text-xs">等待数据...</span>
           </div>
         )}
      </GlassCard>
    </div>
  );
};

export default AnalysisPanel;