import React, { useMemo } from 'react';
import { TradeRecord } from '../types';

interface WinRateStatsProps {
  history: TradeRecord[];
  onClose: () => void;
}

// 模拟计算盈亏百分比
const calculatePnL = (trade: TradeRecord) => {
  if (trade.status === 'pending' || !trade.finalPrice) return 0;
  const diff = trade.direction === 'up' 
    ? (trade.finalPrice - trade.entryPrice)
    : (trade.entryPrice - trade.finalPrice);
  return (diff / trade.entryPrice) * 100 * 10; // 10倍杠杆模拟
};

// 小胶囊数据卡片组件
const CapsuleCard: React.FC<{ 
  label: string; 
  value: string | number; 
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral'; // 用于颜色标识
  className?: string; 
}> = ({ label, value, subValue, trend = 'neutral', className = '' }) => {
  
  let valueColor = 'text-slate-700';
  let bgColor = 'bg-white/60';
  
  if (trend === 'up') {
    valueColor = 'text-emerald-600';
    bgColor = 'bg-emerald-50/50 border-emerald-100/50';
  } else if (trend === 'down') {
    valueColor = 'text-rose-600';
    bgColor = 'bg-rose-50/50 border-rose-100/50';
  }

  return (
    <div className={`backdrop-blur-md border border-white/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-3 flex flex-col justify-center items-center gap-1 transition-transform hover:-translate-y-1 ${bgColor} ${className}`}>
      <span className="text-[10px] text-slate-400 font-medium tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-base font-bold font-mono tracking-tight ${valueColor}`}>
          {value}
        </span>
      </div>
       {subValue && <span className="text-[9px] text-slate-400 bg-white/50 px-1.5 py-0.5 rounded-full">{subValue}</span>}
    </div>
  );
};

const WinRateStats: React.FC<WinRateStatsProps> = ({ history, onClose }) => {
  const stats = useMemo(() => {
    // Safety check for history
    const safeHistory = Array.isArray(history) ? history : [];
    
    const completed = safeHistory.filter(t => t.status !== 'pending');
    const wins = completed.filter(t => t.status === 'win');
    const losses = completed.filter(t => t.status === 'loss');
    
    // 基础计数
    const totalTrades = completed.length;
    const winCount = wins.length;
    const lossCount = losses.length;
    
    // 胜率
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    // 方向偏好
    const longs = completed.filter(t => t.direction === 'up');
    const shorts = completed.filter(t => t.direction === 'down');
    const longWins = longs.filter(t => t.status === 'win').length;
    const shortWins = shorts.filter(t => t.status === 'win').length;
    const longWinRate = longs.length > 0 ? (longWins / longs.length) * 100 : 0;
    const shortWinRate = shorts.length > 0 ? (shortWins / shorts.length) * 100 : 0;

    // 周期偏好
    const t5m = completed.filter(t => t.type === '5m');
    const t10m = completed.filter(t => t.type === '10m');
    const t5mWinRate = t5m.length > 0 ? (t5m.filter(t=>t.status==='win').length / t5m.length * 100) : 0;
    const t10mWinRate = t10m.length > 0 ? (t10m.filter(t=>t.status==='win').length / t10m.length * 100) : 0;

    // 盈亏与连胜
    let totalWinPnL = 0;
    let totalLossPnL = 0;
    let maxDrawdown = 0;
    let peakPnL = 0;
    let runningPnL = 0;
    let streak = 0; 
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let bestTrade = 0;

    completed.forEach(t => {
      const pnl = calculatePnL(t);
      runningPnL += pnl;

      if (runningPnL > peakPnL) peakPnL = runningPnL;
      const dd = peakPnL - runningPnL;
      if (dd > maxDrawdown) maxDrawdown = dd;

      if (pnl > 0) {
        totalWinPnL += pnl;
        if (pnl > bestTrade) bestTrade = pnl;
        if (streak >= 0) streak++; else streak = 1;
        if (streak > maxWinStreak) maxWinStreak = streak;
      } else {
        totalLossPnL += Math.abs(pnl);
        if (streak <= 0) streak--; else streak = -1;
        if (Math.abs(streak) > maxLossStreak) maxLossStreak = Math.abs(streak);
      }
    });

    const profitFactor = totalLossPnL === 0 ? totalWinPnL : totalWinPnL / totalLossPnL;
    const recentTrend = completed.slice(-10).map(t => t.status === 'win');

    return {
      totalTrades,
      winCount,
      lossCount,
      winRate,
      longWinRate,
      shortWinRate,
      t5mWinRate,
      t10mWinRate,
      profitFactor,
      netPnL: runningPnL,
      maxDrawdown,
      currentStreak: streak,
      maxWinStreak,
      maxLossStreak,
      bestTrade,
      recentTrend
    };
  }, [history]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-200/30 backdrop-blur-[6px] animate-fade-in font-sans">
      
      {/* Main Panel Container - High-End White Glass */}
      <div className="w-full max-w-5xl bg-white/85 backdrop-blur-2xl border border-white/80 shadow-[0_30px_60px_-10px_rgba(148,163,184,0.3)] rounded-[32px] flex flex-col max-h-[90vh] overflow-hidden text-slate-700 relative">
        
        {/* Decorative background blobs inside the card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-50/50 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/40">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </span>
              智能交易回测报告
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1 pl-1">AI 策略历史表现数据分析</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8">
          
          {/* Section 1: Hero Stats (Big Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Win Rate Card */}
             <div className="bg-gradient-to-br from-white to-slate-50 border border-white shadow-lg shadow-slate-100/50 rounded-[2rem] p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                   <svg className="w-24 h-24 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                </div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">综合胜率</div>
                <div className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter">
                  {stats.winRate.toFixed(0)}<span className="text-2xl md:text-3xl text-slate-400 font-bold ml-1">%</span>
                </div>
                <div className="mt-6 flex items-center gap-1.5">
                   <span className="text-[10px] font-bold text-slate-400 mr-1">近10单趋势:</span>
                   {stats.recentTrend.map((win, i) => (
                      <div key={i} className={`h-2 flex-1 rounded-full ${win ? 'bg-emerald-400' : 'bg-rose-300'}`}></div>
                   ))}
                </div>
             </div>

             {/* PnL Card */}
             <div className="bg-gradient-to-br from-white to-slate-50 border border-white shadow-lg shadow-slate-100/50 rounded-[2rem] p-6 flex flex-col justify-center">
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">模拟净收益</div>
                      <div className={`text-3xl md:text-4xl font-black tracking-tight ${stats.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stats.netPnL > 0 ? '+' : ''}{stats.netPnL.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">盈亏因子</div>
                      <div className="text-3xl md:text-4xl font-black text-slate-700 tracking-tight">
                        {stats.profitFactor.toFixed(2)}
                      </div>
                    </div>
                 </div>
                 <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">当前连势</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${stats.currentStreak > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                       {stats.currentStreak > 0 ? `连胜 ${stats.currentStreak} 单` : `连败 ${Math.abs(stats.currentStreak)} 单`}
                    </span>
                 </div>
             </div>
          </div>

          {/* Section 2: Detailed Capsules Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2">核心指标分析</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
               <CapsuleCard label="总交易" value={stats.totalTrades} />
               <CapsuleCard label="止盈单" value={stats.winCount} trend="up" />
               <CapsuleCard label="止损单" value={stats.lossCount} trend="down" />
               
               <CapsuleCard label="做多胜率" value={`${stats.longWinRate.toFixed(0)}%`} trend={stats.longWinRate > 50 ? 'up' : 'neutral'} />
               <CapsuleCard label="做空胜率" value={`${stats.shortWinRate.toFixed(0)}%`} trend={stats.shortWinRate > 50 ? 'up' : 'neutral'} />
               
               <CapsuleCard label="5分钟胜率" value={`${stats.t5mWinRate.toFixed(0)}%`} />
               <CapsuleCard label="10分钟胜率" value={`${stats.t10mWinRate.toFixed(0)}%`} />
               
               <CapsuleCard label="最佳单笔" value={`+${stats.bestTrade.toFixed(1)}%`} trend="up" />
               <CapsuleCard label="最大回撤" value={`-${stats.maxDrawdown.toFixed(1)}%`} trend="down" />
               <CapsuleCard label="最长连胜" value={stats.maxWinStreak} trend="up" subValue="Max" />
            </div>
          </div>

          {/* Section 3: Trade Log List */}
          <div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2">近期交易记录</h3>
             <div className="space-y-2">
                {(!history || history.length === 0) ? (
                  <div className="text-center py-10 text-slate-400 text-sm font-medium bg-white/40 rounded-3xl border border-dashed border-slate-200">
                    暂无交易数据，请等待 AI 生成分析信号
                  </div>
                ) : (
                  history.slice().reverse().map(trade => {
                     const pnl = calculatePnL(trade);
                     return (
                        <div key={trade.id} className="group flex flex-wrap md:flex-nowrap items-center justify-between p-3 bg-white/50 border border-white/80 shadow-sm rounded-2xl hover:bg-white hover:shadow-md hover:scale-[1.005] transition-all duration-300">
                           
                           {/* Left: Time & Symbol */}
                           <div className="flex items-center gap-4 w-full md:w-auto mb-2 md:mb-0">
                              <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded-lg min-w-[60px] text-center">
                                {new Date(trade.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              <div className="flex flex-col">
                                 <span className="text-xs font-bold text-slate-700">{trade.symbol}</span>
                                 <span className="text-[9px] text-slate-400 font-medium">{trade.type === '5m' ? '5分钟超短线' : '10分钟短线'}</span>
                              </div>
                           </div>

                           {/* Middle: Direction & Prices */}
                           <div className="flex items-center gap-6 md:gap-10 w-full md:w-auto justify-between md:justify-start">
                              <div className="flex flex-col items-center">
                                 <span className="text-[9px] text-slate-400">方向</span>
                                 <span className={`text-xs font-bold ${trade.direction === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {trade.direction === 'up' ? '做多 (Long)' : '做空 (Short)'}
                                 </span>
                              </div>
                              <div className="flex flex-col items-center">
                                 <span className="text-[9px] text-slate-400">入场价</span>
                                 <span className="text-xs font-mono font-medium text-slate-600">${trade.entryPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                 <span className="text-[9px] text-slate-400">结算价</span>
                                 <span className="text-xs font-mono font-medium text-slate-600">{trade.finalPrice ? `$${trade.finalPrice.toFixed(2)}` : '--'}</span>
                              </div>
                           </div>

                           {/* Right: Status & PnL */}
                           <div className="flex items-center gap-3 w-full md:w-auto justify-end mt-2 md:mt-0 pl-4 border-l border-slate-100 md:border-0">
                              {trade.status === 'pending' ? (
                                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100 animate-pulse">
                                  进行中
                                </span>
                              ) : (
                                <>
                                  <span className={`text-xs font-black font-mono ${pnl > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                     {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}%
                                  </span>
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${trade.status === 'win' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                     {trade.status === 'win' ? '止盈' : '止损'}
                                  </span>
                                </>
                              )}
                           </div>
                        </div>
                     );
                  })
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WinRateStats;