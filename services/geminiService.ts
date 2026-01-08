import { GoogleGenAI, Type } from "@google/genai";
import { Candle, AIAnalysisResult, CoinSymbol } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
你是一位激进且精准的量化加密货币交易员。
任务：分析实时 OHLCV 数据，提供 8 维评分、深度的 K 线相似度对比（需提供至少 5 个历史锚点），并给出**明确**的操作建议。

重要规则：
1. **严禁**给出模棱两可的建议。必须在 BUY (做多) 或 SELL (做空) 中选择一个概率最大的方向。
2. 即使市场震荡，也必须根据微观结构判断短期突破方向。
3. 所有文本字段用**中文**。
4. 输出严格 JSON。

关于 K 线相似度 (Similarity Analysis)：
- **不要** 仅仅通过回忆宏观新闻事件（如“2021年5月崩盘”）来对比。
- **必须** 进行纯粹的数据形态对比 (Pattern Matching)。寻找历史上 K 线形态（蜡烛图组合）、技术指标（RSI/MACD背离）和成交量分布最相似的时刻。
- historicalMatches 必须返回具体的历史时间段（精确到月份或特定日期范围）以及当时的数据相似度百分比。
- 重点分析：趋势斜率、波动率收缩/扩张形态、关键位假突破等微观结构。

关于操作建议 (Action Signal)：
- 只能是 "BUY" 或 "SELL"。
`;

export const analyzeMarket = async (symbol: CoinSymbol, candles: Candle[]): Promise<AIAnalysisResult | null> => {
  try {
    const recentCandles = candles.slice(-30).map(c => ({
      t: new Date(c.time).toISOString(),
      o: c.open,
      h: c.high,
      l: c.low,
      c: c.close,
      v: c.volume
    }));

    const prompt = `
      分析 ${symbol} 数据。当前价格 ${recentCandles[recentCandles.length - 1].c}。
      
      数据: ${JSON.stringify(recentCandles)}

      要求返回 JSON 数据，包含：
      1. actionSignal (必须是 BUY 或 SELL)
      2. trend5m (direction: up/down) & trend10m (direction: up/down)
      3. dimensions (8个维度)
      4. similarity (
          重点分析历史数据形态。
          historicalMatches: 列出至少 5 个历史上最相似的 K 线走势片段，按相似度降序排列。
          period: 例如 "2023-01-15 4H" 或 "2022-11 Bottom"。
          outcome: 简单描述该形态后的走势，如 "上涨 5%" 或 "下跌洗盘"。
          similarityScore: 总体形态相似度 0-100%。
          trendCorrelation: 趋势相关系数 0-100。
      )
      5. summary
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actionSignal: { type: Type.STRING, enum: ['BUY', 'SELL'] },
            trend5m: {
              type: Type.OBJECT,
              properties: {
                direction: { type: Type.STRING, enum: ['up', 'down'] },
                priceTarget: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER },
                reasoning: { type: Type.STRING }
              }
            },
            trend10m: {
              type: Type.OBJECT,
              properties: {
                direction: { type: Type.STRING, enum: ['up', 'down'] },
                priceTarget: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER },
                reasoning: { type: Type.STRING }
              }
            },
            dimensions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  insight: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] }
                }
              }
            },
            similarity: {
              type: Type.OBJECT,
              properties: {
                matchedPattern: { type: Type.STRING },
                similarityScore: { type: Type.NUMBER },
                curvatureComparison: { type: Type.STRING },
                historicalOutcome: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Choppy'] },
                patternDuration: { type: Type.STRING },
                volumeCorrelation: { type: Type.NUMBER },
                keyLevel: { type: Type.STRING },
                volatilityMatch: { type: Type.NUMBER },
                trendCorrelation: { type: Type.NUMBER },
                historicalMatches: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      period: { type: Type.STRING },
                      similarity: { type: Type.NUMBER },
                      outcome: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    return null;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return null;
  }
};