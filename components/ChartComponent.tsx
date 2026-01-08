import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceArea
} from 'recharts';
import { Candle, AIAnalysisResult } from '../types';
import GlassCard from './GlassCard';

interface ChartComponentProps {
  data: Candle[];
  symbol: string;
  analysis?: AIAnalysisResult | null;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data, symbol, analysis }) => {
  const formattedData = data.map((d, index) => ({
    ...d,
    timeStr: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    originalIndex: index
  }));

  const isUp = data.length > 1 && data[data.length - 1].close >= data[data.length - 2].close;
  const color = isUp ? '#059669' : '#e11d48';

  // Calculate the start of the analysis range (last 30 candles)
  const analysisLength = 30;
  const startIndex = Math.max(0, formattedData.length - analysisLength);
  const startData = formattedData[startIndex];
  const endData = formattedData[formattedData.length - 1];

  // Custom Tooltip with Similarity Highlight
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentData = payload[0].payload;
      const isAnalyzedRegion = currentData.originalIndex >= startIndex && analysis;
      const currentPrice = currentData.close;

      return (
        <div className="bg-white/90 backdrop-blur-md border border-white/50 rounded-2xl shadow-xl p-3 min-w-[180px]">
          {/* Header Time */}
          <p className="text-[10px] text-slate-400 font-bold mb-2">{label}</p>
          
          {/* Price */}
          <div className="flex justify-between items-center mb-1">
             <span className="text-xs text-slate-600 font-medium">价格:</span>
             <span className="text-sm font-black text-slate-800 font-mono">${currentPrice.toFixed(2)}</span>
          </div>

          {/* Volume */}
           <div className="flex justify-between items-center mb-3">
             <span className="text-xs text-slate-600 font-medium">成交量:</span>
             <span className="text-xs text-slate-500 font-mono">{currentData.volume.toFixed(2)}</span>
          </div>

          {/* AI Insight Section (Only if in analyzed region) */}
          {isAnalyzedRegion && analysis && (
            <div className="mt-2 pt-2 border-t border-slate-100 bg-indigo-50/50 -mx-3 px-3 pb-1">
               <div className="flex items-center gap-1.5 mb-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">AI 模式指纹匹配</span>
               </div>
               
               <div className="space-y-1">
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] text-slate-500">识别形态:</span>
                     <span className="text-[10px] font-bold text-slate-700">{analysis.similarity.matchedPattern}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] text-slate-500">相似度:</span>
                     <span className="text-[10px] font-bold text-emerald-600">{analysis.similarity.similarityScore}%</span>
                  </div>
                  {analysis.similarity.historicalMatches && analysis.similarity.historicalMatches[0] && (
                     <div className="flex flex-col mt-1.5 bg-white/60 p-1.5 rounded-lg border border-white/50">
                        <span className="text-[8px] text-slate-400 mb-0.5">历史最佳匹配:</span>
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-bold text-slate-700">{analysis.similarity.historicalMatches[0].period}</span>
                           <span className="text-[9px] font-bold text-indigo-500">{analysis.similarity.historicalMatches[0].similarity}%</span>
                        </div>
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard className="p-4 md:p-8 h-[400px] md:h-[500px] flex flex-col w-full relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/60">
      <div className="flex justify-between items-center mb-2">
        <div>
           <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2 md:gap-3">
             {symbol} <span className="text-[10px] md:text-sm text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full">USD 计价</span>
           </h3>
           <p className="text-[10px] md:text-xs text-slate-400 mt-1 pl-1">实时 K 线走势 {analysis && <span className="text-indigo-500 font-bold ml-1">(高亮区域为 AI 采样区)</span>}</p>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">1分钟 周期</span>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="analyzedRegion" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor="#6366f1" stopOpacity={0.05}/>
                 <stop offset="100%" stopColor="#6366f1" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
            <XAxis 
              dataKey="timeStr" 
              stroke="#cbd5e1" 
              tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 500}} 
              tickLine={false}
              axisLine={false}
              minTickGap={50}
              dy={10}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#cbd5e1" 
              tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 500}} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val.toFixed(2)}
              width={50}
              dx={-10}
            />
            
            {/* Highlight the analyzed region */}
            {analysis && startData && endData && (
              <ReferenceArea 
                x1={startData.timeStr} 
                x2={endData.timeStr} 
                fill="url(#analyzedRegion)"
                strokeOpacity={0}
              />
            )}

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
            
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke={color} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={800}
            />
            <Brush 
              dataKey="timeStr" 
              height={20} 
              stroke="#e2e8f0" 
              fill="#f8fafc"
              tickFormatter={() => ''}
              travellerWidth={10}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

export default ChartComponent;