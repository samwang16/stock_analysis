const express = require('express');
const cors = require('cors');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 初始关注的股票代码列表
const followedStockSymbols = ['AAPL', 'MSFT', 'TSLA', 'GOOGL'];

// 辅助函数：格式化涨跌幅
const formatChange = (regularMarketChangePercent) => {
  if (regularMarketChangePercent === undefined || regularMarketChangePercent === null) return '0.00%';
  const sign = regularMarketChangePercent >= 0 ? '+' : '';
  return `${sign}${regularMarketChangePercent.toFixed(2)}%`;
};

// 获取股票列表（支持通过 symbols 参数传入特定代码列表）
app.get('/api/stocks', async (req, res) => {
  try {
    let symbolsToFetch = [];
    if (req.query.symbols) {
      symbolsToFetch = req.query.symbols.split(',').map(s => s.trim().toUpperCase());
    } else {
      // 默认空列表
      symbolsToFetch = [];
    }

    if (symbolsToFetch.length === 0) {
      return res.json([]);
    }

    const results = await Promise.all(
      symbolsToFetch.map(async (symbol) => {
        try {
          const quote = await yahooFinance.quote(symbol);
          return {
            id: symbol,
            name: quote.shortName || quote.longName || symbol,
            price: quote.regularMarketPrice || 0,
            change: formatChange(quote.regularMarketChangePercent)
          };
        } catch (err) {
          console.error(`Error fetching quote for ${symbol}:`, err);
          return null;
        }
      })
    );
    // 过滤掉获取失败的股票
    res.json(results.filter(r => r !== null));
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 获取某只股票的K线数据
app.get('/api/stocks/:id/kline', async (req, res) => {
  const stockId = req.params.id.toUpperCase();
  const validIntervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'];
  const interval = validIntervals.includes(req.query.interval) ? req.query.interval : '1d';
  
  try {
    const period1 = new Date();
    
    // 根据时间粒度设置不同的时间范围
    if (['1m', '2m', '5m', '15m', '30m'].includes(interval)) {
      period1.setDate(period1.getDate() - 1); // 分钟级数据获取最近1天
    } else if (['60m', '90m', '1h'].includes(interval)) {
      period1.setDate(period1.getDate() - 7); // 小时级数据获取最近7天
    } else if (interval === '1d') {
      period1.setDate(period1.getDate() - 30); // 日线获取最近30天
    } else if (interval === '1wk') {
      period1.setMonth(period1.getMonth() - 3); // 周线获取最近3个月
    } else if (interval === '1mo') {
      period1.setFullYear(period1.getFullYear() - 1); // 月线获取最近1年
    }
    
    const period2 = new Date(); // 当前时间

    const queryOptions = { 
      period1: period1.toISOString().split('T')[0],
      period2: period2.toISOString().split('T')[0],
      interval: interval
    };
    
    const result = await yahooFinance.chart(stockId, queryOptions);
    
    const kLineData = result.quotes.map(item => ({
      date: item.date.toISOString(),
      open: parseFloat(item.open.toFixed(2)),
      close: parseFloat(item.close.toFixed(2)),
      high: parseFloat(item.high.toFixed(2)),
      low: parseFloat(item.low.toFixed(2)),
      volume: item.volume
    }));
    
    res.json(kLineData);
  } catch (error) {
    console.error(`Error fetching K-line data for ${stockId}:`, error);
    res.status(500).json({ message: 'Error fetching K-line data' });
  }
});

// 获取某只股票的近期交易分析
app.get('/api/stocks/:id/analysis', async (req, res) => {
  const stockId = req.params.id.toUpperCase();
  
  try {
    const quote = await yahooFinance.quote(stockId);
    
    if (!quote) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    const price = quote.regularMarketPrice;
    const changePercent = quote.regularMarketChangePercent || 0;
    
    // 基于真实数据的简单分析逻辑
    let trend = '震荡';
    if (changePercent > 1.5) trend = '强势上涨';
    else if (changePercent > 0) trend = '小幅上涨';
    else if (changePercent < -1.5) trend = '大幅下跌';
    else if (changePercent < 0) trend = '小幅下跌';

    let recommendation = '观望';
    if (trend === '强势上涨') recommendation = '可考虑追入';
    else if (trend === '大幅下跌') recommendation = '谨慎抄底';
    else if (trend === '小幅上涨') recommendation = '继续持有';

    const analysis = {
      stockId,
      name: quote.shortName || quote.longName || stockId,
      summary: `当前价格 $${price}，今日涨跌幅 ${formatChange(changePercent)}。${
        quote.regularMarketVolume > quote.averageDailyVolume10Day ? '成交量较近期平均有所放大。' : '成交量平稳。'
      }`,
      trend,
      supportLevel: parseFloat((price * 0.95).toFixed(2)),
      resistanceLevel: parseFloat((price * 1.05).toFixed(2)),
      recommendation
    };

    res.json(analysis);
  } catch (error) {
    console.error(`Error fetching analysis for ${stockId}:`, error);
    res.status(500).json({ message: 'Error fetching stock analysis' });
  }
});

// 初始关注的虚拟货币代码列表
const followedCryptoSymbols = ['BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD'];

// 获取虚拟货币列表
app.get('/api/cryptos', async (req, res) => {
  try {
    let symbolsToFetch = [];
    if (req.query.symbols) {
      symbolsToFetch = req.query.symbols.split(',').map(s => s.trim().toUpperCase());
    } else {
      symbolsToFetch = [];
    }

    if (symbolsToFetch.length === 0) {
      return res.json([]);
    }

    const results = await Promise.all(
      symbolsToFetch.map(async (symbol) => {
        try {
          const quote = await yahooFinance.quote(symbol);
          return {
            id: symbol,
            name: quote.shortName || quote.longName || symbol,
            price: quote.regularMarketPrice || 0,
            change: formatChange(quote.regularMarketChangePercent)
          };
        } catch (err) {
          console.error(`Error fetching quote for ${symbol}:`, err);
          return null;
        }
      })
    );
    res.json(results.filter(r => r !== null));
  } catch (error) {
    console.error('Error fetching cryptos:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 获取某个虚拟货币的K线数据
app.get('/api/cryptos/:id/kline', async (req, res) => {
  const cryptoId = req.params.id.toUpperCase();
  const validIntervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'];
  const interval = validIntervals.includes(req.query.interval) ? req.query.interval : '1d';
  
  try {
    const period1 = new Date();
    
    if (['1m', '2m', '5m', '15m', '30m'].includes(interval)) {
      period1.setDate(period1.getDate() - 1);
    } else if (['60m', '90m', '1h'].includes(interval)) {
      period1.setDate(period1.getDate() - 7);
    } else if (interval === '1d') {
      period1.setDate(period1.getDate() - 30);
    } else if (interval === '1wk') {
      period1.setMonth(period1.getMonth() - 3);
    } else if (interval === '1mo') {
      period1.setFullYear(period1.getFullYear() - 1);
    }
    
    const period2 = new Date();

    const queryOptions = { 
      period1: period1.toISOString().split('T')[0],
      period2: period2.toISOString().split('T')[0],
      interval: interval
    };
    
    const result = await yahooFinance.chart(cryptoId, queryOptions);
    
    const kLineData = result.quotes.map(item => ({
      date: item.date.toISOString(),
      open: parseFloat(item.open.toFixed(2)),
      close: parseFloat(item.close.toFixed(2)),
      high: parseFloat(item.high.toFixed(2)),
      low: parseFloat(item.low.toFixed(2)),
      volume: item.volume
    }));
    
    res.json(kLineData);
  } catch (error) {
    console.error(`Error fetching K-line data for ${cryptoId}:`, error);
    res.status(500).json({ message: 'Error fetching K-line data' });
  }
});

// 获取某个虚拟货币的近期交易分析
app.get('/api/cryptos/:id/analysis', async (req, res) => {
  const cryptoId = req.params.id.toUpperCase();
  
  try {
    const quote = await yahooFinance.quote(cryptoId);
    
    if (!quote) {
      return res.status(404).json({ message: 'Crypto not found' });
    }

    const price = quote.regularMarketPrice;
    const changePercent = quote.regularMarketChangePercent || 0;
    
    let trend = '震荡';
    if (changePercent > 3) trend = '强势上涨';
    else if (changePercent > 0) trend = '小幅上涨';
    else if (changePercent < -3) trend = '大幅下跌';
    else if (changePercent < 0) trend = '小幅下跌';

    let recommendation = '观望';
    if (trend === '强势上涨') recommendation = '可考虑追入';
    else if (trend === '大幅下跌') recommendation = '谨慎抄底';
    else if (trend === '小幅上涨') recommendation = '继续持有';

    const analysis = {
      cryptoId,
      name: quote.shortName || quote.longName || cryptoId,
      summary: `当前价格 $${price}，24h涨跌幅 ${formatChange(changePercent)}。${
        quote.regularMarketVolume > quote.averageDailyVolume10Day ? '成交量较近期平均有所放大。' : '成交量平稳。'
      }`,
      trend,
      supportLevel: parseFloat((price * 0.93).toFixed(2)),
      resistanceLevel: parseFloat((price * 1.07).toFixed(2)),
      recommendation
    };

    res.json(analysis);
  } catch (error) {
    console.error(`Error fetching analysis for ${cryptoId}:`, error);
    res.status(500).json({ message: 'Error fetching crypto analysis' });
  }
});

// ============ 量化分析辅助函数 ============

// 计算 SMA（简单移动平均）
const calcSMA = (data, period) => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    result.push(sum / period);
  }
  return result;
};

// 计算 EMA（指数移动平均）
const calcEMA = (data, period) => {
  const result = [];
  const k = 2 / (period + 1);
  let ema = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    if (ema === null) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += data[j];
      ema = sum / period;
    } else {
      ema = data[i] * k + ema * (1 - k);
    }
    result.push(ema);
  }
  return result;
};

// 计算 MACD
const calcMACD = (closes) => {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const dif = closes.map((_, i) => (ema12[i] !== null && ema26[i] !== null) ? ema12[i] - ema26[i] : null);
  const difValues = dif.filter(v => v !== null);
  const dea = calcEMA(difValues, 9);
  const macdHist = [];
  let deaIdx = 0;
  for (let i = 0; i < dif.length; i++) {
    if (dif[i] === null) { macdHist.push(null); continue; }
    const d = deaIdx < dea.length ? dea[deaIdx] : null;
    deaIdx++;
    macdHist.push(d !== null ? 2 * (dif[i] - d) : null);
  }
  return { dif, dea: dea, macdHist };
};

// 计算 RSI
const calcRSI = (closes, period = 14) => {
  const result = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) { result.push(null); continue; }
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }
  return result;
};

// 计算布林带
const calcBollinger = (closes, period = 20, multiplier = 2) => {
  const sma = calcSMA(closes, period);
  const upper = [], lower = [];
  for (let i = 0; i < closes.length; i++) {
    if (sma[i] === null) { upper.push(null); lower.push(null); continue; }
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) sumSq += (closes[j] - sma[i]) ** 2;
    const std = Math.sqrt(sumSq / period);
    upper.push(sma[i] + multiplier * std);
    lower.push(sma[i] - multiplier * std);
  }
  return { upper, middle: sma, lower };
};

// 计算ATR
const calcATR = (klineData, period = 14) => {
  const trs = [];
  for (let i = 0; i < klineData.length; i++) {
    if (i === 0) { trs.push(klineData[i].high - klineData[i].low); continue; }
    trs.push(Math.max(
      klineData[i].high - klineData[i].low,
      Math.abs(klineData[i].high - klineData[i - 1].close),
      Math.abs(klineData[i].low - klineData[i - 1].close)
    ));
  }
  return calcSMA(trs, period);
};

// 量化评分核心函数
const computeQuantScore = (klineData) => {
  if (!klineData || klineData.length < 60) return null;

  const closes = klineData.map(d => d.close);
  const volumes = klineData.map(d => d.volume);
  const last = closes.length - 1;
  const price = closes[last];

  // --- 1. 趋势得分 (30分) ---
  const ma5 = calcSMA(closes, 5);
  const ma20 = calcSMA(closes, 20);
  const ma60 = calcSMA(closes, 60);

  let trendScore = 0;
  // MA多头排列
  if (ma5[last] && ma20[last] && ma60[last]) {
    if (ma5[last] > ma20[last] && ma20[last] > ma60[last]) trendScore += 40;
    else if (ma5[last] > ma20[last]) trendScore += 25;
    else if (ma5[last] < ma20[last] && ma20[last] < ma60[last]) trendScore += 5;
    else trendScore += 15;
  }
  // 价格站上MA20
  if (ma20[last]) {
    if (price > ma20[last]) trendScore += 30;
    else trendScore += 10;
  }
  // MACD
  const { dif, macdHist } = calcMACD(closes);
  const lastDif = dif.filter(v => v !== null);
  const lastHist = macdHist.filter(v => v !== null);
  if (lastDif.length >= 2) {
    const curDif = lastDif[lastDif.length - 1];
    const prevDif = lastDif[lastDif.length - 2];
    if (curDif > 0 && prevDif <= 0) trendScore += 30; // 金叉
    else if (curDif > 0) trendScore += 20;
    else if (curDif < 0 && prevDif >= 0) trendScore += 5; // 死叉
    else trendScore += 10;
  }
  trendScore = Math.round(trendScore * 0.3); // 满分30

  // --- 2. 动量得分 (20分) ---
  const rsi = calcRSI(closes, 14);
  const lastRSI = rsi.filter(v => v !== null);
  let momentumScore = 0;
  if (lastRSI.length > 0) {
    const curRSI = lastRSI[lastRSI.length - 1];
    if (curRSI < 30) momentumScore = 90; // 超卖，反弹机会
    else if (curRSI < 40) momentumScore = 75;
    else if (curRSI < 55) momentumScore = 60;
    else if (curRSI < 70) momentumScore = 45;
    else momentumScore = 20; // 超买
  }
  momentumScore = Math.round(momentumScore * 0.2); // 满分20

  // --- 3. 波动率得分 (15分) ---
  const bollinger = calcBollinger(closes, 20);
  let volatilityScore = 0;
  if (bollinger.upper[last] && bollinger.lower[last]) {
    const bandwidth = (bollinger.upper[last] - bollinger.lower[last]) / bollinger.middle[last];
    const prevBandwidth = bollinger.upper[last - 1] && bollinger.lower[last - 1]
      ? (bollinger.upper[last - 1] - bollinger.lower[last - 1]) / bollinger.middle[last - 1] : bandwidth;
    // 布林带收口后突破
    if (bandwidth < prevBandwidth && price > bollinger.middle[last]) volatilityScore = 80;
    else if (bandwidth < prevBandwidth) volatilityScore = 60; // 收口中
    else if (price <= bollinger.lower[last]) volatilityScore = 75; // 触下轨
    else if (price >= bollinger.upper[last]) volatilityScore = 35; // 触上轨
    else volatilityScore = 55;
  }
  volatilityScore = Math.round(volatilityScore * 0.15); // 满分15

  // --- 4. 量价得分 (20分) ---
  let volumeScore = 0;
  if (last >= 5) {
    const avgVol5 = volumes.slice(last - 4).reduce((a, b) => a + b, 0) / 5;
    const priceUp = closes[last] > closes[last - 1];
    const volUp = volumes[last] > avgVol5;
    if (priceUp && volUp) volumeScore = 90; // 价涨量增
    else if (priceUp && !volUp) volumeScore = 55; // 价涨量缩
    else if (!priceUp && volUp) volumeScore = 25; // 价跌量增
    else volumeScore = 50; // 价跌量缩（可能见底）
  }
  volumeScore = Math.round(volumeScore * 0.2); // 满分20

  // --- 5. 估值得分 (15分) ---
  // 基于价格在近期区间中的位置来模拟估值
  const high60 = Math.max(...closes.slice(-60));
  const low60 = Math.min(...closes.slice(-60));
  const pricePosition = (price - low60) / (high60 - low60);
  let valuationScore = 0;
  if (pricePosition < 0.2) valuationScore = 90; // 接近低位，估值偏低
  else if (pricePosition < 0.4) valuationScore = 75;
  else if (pricePosition < 0.6) valuationScore = 55;
  else if (pricePosition < 0.8) valuationScore = 40;
  else valuationScore = 20; // 接近高位，估值偏高
  valuationScore = Math.round(valuationScore * 0.15); // 满分15

  const totalScore = trendScore + momentumScore + volatilityScore + volumeScore + valuationScore;

  // 综合建议
  let suggestion = '观望等待';
  let suggestionColor = 'orange';
  if (totalScore >= 80) { suggestion = '强烈买入'; suggestionColor = 'green'; }
  else if (totalScore >= 60) { suggestion = '可以买入'; suggestionColor = 'blue'; }
  else if (totalScore >= 40) { suggestion = '观望等待'; suggestionColor = 'orange'; }
  else { suggestion = '不建议买入'; suggestionColor = 'red'; }

  // 指标详情
  const lastMA5 = ma5[last] ? parseFloat(ma5[last].toFixed(2)) : null;
  const lastMA20 = ma20[last] ? parseFloat(ma20[last].toFixed(2)) : null;
  const lastMA60 = ma60[last] ? parseFloat(ma60[last].toFixed(2)) : null;
  const lastRSIVal = lastRSI.length > 0 ? parseFloat(lastRSI[lastRSI.length - 1].toFixed(2)) : null;
  const lastDifVal = lastDif.length > 0 ? parseFloat(lastDif[lastDif.length - 1].toFixed(2)) : null;
  const lastMacdHistVal = lastHist.length > 0 ? parseFloat(lastHist[lastHist.length - 1].toFixed(2)) : null;
  const lastBollUpper = bollinger.upper[last] ? parseFloat(bollinger.upper[last].toFixed(2)) : null;
  const lastBollMiddle = bollinger.middle[last] ? parseFloat(bollinger.middle[last].toFixed(2)) : null;
  const lastBollLower = bollinger.lower[last] ? parseFloat(bollinger.lower[last].toFixed(2)) : null;
  const atrValues = calcATR(klineData, 14);
  const lastATR = atrValues[last] ? parseFloat(atrValues[last].toFixed(2)) : null;

  return {
    totalScore,
    suggestion,
    suggestionColor,
    dimensions: [
      { name: '趋势', weight: '30%', score: trendScore, maxScore: 30, description: getTrendDesc(ma5[last], ma20[last], ma60[last], lastDifVal) },
      { name: '动量', weight: '20%', score: momentumScore, maxScore: 20, description: getMomentumDesc(lastRSIVal) },
      { name: '波动率', weight: '15%', score: volatilityScore, maxScore: 15, description: getVolatilityDesc(price, lastBollUpper, lastBollLower, lastBollMiddle) },
      { name: '量价', weight: '20%', score: volumeScore, maxScore: 20, description: getVolumeDesc(closes[last], closes[last - 1], volumes[last], last >= 5 ? volumes.slice(last - 4).reduce((a, b) => a + b, 0) / 5 : 0) },
      { name: '估值', weight: '15%', score: valuationScore, maxScore: 15, description: getValuationDesc(pricePosition, low60, high60) }
    ],
    indicators: {
      MA5: lastMA5,
      MA20: lastMA20,
      MA60: lastMA60,
      RSI: lastRSIVal,
      MACD_DIF: lastDifVal,
      MACD_Hist: lastMacdHistVal,
      Bollinger_Upper: lastBollUpper,
      Bollinger_Middle: lastBollMiddle,
      Bollinger_Lower: lastBollLower,
      ATR: lastATR,
      Price_Position: parseFloat((pricePosition * 100).toFixed(1))
    }
  };
};

const getTrendDesc = (ma5, ma20, ma60, dif) => {
  const parts = [];
  if (ma5 && ma20 && ma60) {
    if (ma5 > ma20 && ma20 > ma60) parts.push('MA多头排列');
    else if (ma5 < ma20 && ma20 < ma60) parts.push('MA空头排列');
    else parts.push('MA交叉震荡');
  }
  if (dif !== null) {
    parts.push(dif > 0 ? 'MACD多头' : 'MACD空头');
  }
  return parts.join('，') || '数据不足';
};

const getMomentumDesc = (rsi) => {
  if (rsi === null) return '数据不足';
  if (rsi < 30) return `RSI=${rsi} 超卖区`;
  if (rsi < 40) return `RSI=${rsi} 偏弱`;
  if (rsi < 55) return `RSI=${rsi} 中性`;
  if (rsi < 70) return `RSI=${rsi} 偏强`;
  return `RSI=${rsi} 超买区`;
};

const getVolatilityDesc = (price, upper, lower, middle) => {
  if (!upper || !lower) return '数据不足';
  if (price <= lower) return '触及布林下轨，可能反弹';
  if (price >= upper) return '触及布林上轨，注意回调';
  if (price > middle) return '布林中轨上方，偏强';
  return '布林中轨下方，偏弱';
};

const getVolumeDesc = (curPrice, prevPrice, curVol, avgVol) => {
  const priceUp = curPrice > prevPrice;
  const volUp = curVol > avgVol;
  if (priceUp && volUp) return '价涨量增，健康上涨';
  if (priceUp && !volUp) return '价涨量缩，动力不足';
  if (!priceUp && volUp) return '价跌量增，抛压较重';
  return '价跌量缩，抛压减弱';
};

const getValuationDesc = (position, low, high) => {
  if (position < 0.2) return `价格接近60日低点$${low.toFixed(2)}，估值偏低`;
  if (position < 0.4) return '价格处于60日偏低区间';
  if (position < 0.6) return '价格处于60日中间区间';
  if (position < 0.8) return '价格处于60日偏高区间';
  return `价格接近60日高点$${high.toFixed(2)}，估值偏高`;
};

// 获取某只股票的量化分析
app.get('/api/stocks/:id/quant', async (req, res) => {
  const stockId = req.params.id.toUpperCase();
  try {
    const period1 = new Date();
    period1.setDate(period1.getDate() - 120); // 获取120天数据确保MA60有值
    const period2 = new Date();
    const queryOptions = {
      period1: period1.toISOString().split('T')[0],
      period2: period2.toISOString().split('T')[0],
      interval: '1d'
    };
    const result = await yahooFinance.chart(stockId, queryOptions);
    const kLineData = result.quotes
      .filter(item => item.open && item.close && item.high && item.low)
      .map(item => ({
        date: item.date.toISOString(),
        open: parseFloat(item.open.toFixed(2)),
        close: parseFloat(item.close.toFixed(2)),
        high: parseFloat(item.high.toFixed(2)),
        low: parseFloat(item.low.toFixed(2)),
        volume: item.volume || 0
      }));
    const quantResult = computeQuantScore(kLineData);
    if (!quantResult) {
      return res.json({ totalScore: 0, suggestion: '数据不足', suggestionColor: 'gray', dimensions: [], indicators: {} });
    }
    res.json(quantResult);
  } catch (error) {
    console.error(`Error fetching quant analysis for ${stockId}:`, error);
    res.status(500).json({ message: 'Error fetching quant analysis' });
  }
});

// 获取某个虚拟货币的量化分析
app.get('/api/cryptos/:id/quant', async (req, res) => {
  const cryptoId = req.params.id.toUpperCase();
  try {
    const period1 = new Date();
    period1.setDate(period1.getDate() - 120);
    const period2 = new Date();
    const queryOptions = {
      period1: period1.toISOString().split('T')[0],
      period2: period2.toISOString().split('T')[0],
      interval: '1d'
    };
    const result = await yahooFinance.chart(cryptoId, queryOptions);
    const kLineData = result.quotes
      .filter(item => item.open && item.close && item.high && item.low)
      .map(item => ({
        date: item.date.toISOString(),
        open: parseFloat(item.open.toFixed(2)),
        close: parseFloat(item.close.toFixed(2)),
        high: parseFloat(item.high.toFixed(2)),
        low: parseFloat(item.low.toFixed(2)),
        volume: item.volume || 0
      }));
    const quantResult = computeQuantScore(kLineData);
    if (!quantResult) {
      return res.json({ totalScore: 0, suggestion: '数据不足', suggestionColor: 'gray', dimensions: [], indicators: {} });
    }
    res.json(quantResult);
  } catch (error) {
    console.error(`Error fetching quant analysis for ${cryptoId}:`, error);
    res.status(500).json({ message: 'Error fetching quant analysis' });
  }
});

// Finlight API 获取最新新闻
const FINLIGHT_API_KEY = process.env.FINLIGHT_API_KEY || 'sk_709bfe1241f46918ed2899805c5c9e7f41d3190d7ec010a98609b4e1c1bc04dc';
const FINLIGHT_API_URL = process.env.FINLIGHT_API_URL || 'https://api.finlight.me/v2/articles';

app.get('/api/news', async (req, res) => {
  try {
    if (!FINLIGHT_API_KEY) {
      return res.status(500).json({ message: 'Finlight API key is not configured. Please set FINLIGHT_API_KEY environment variable.' });
    }

    const { keyword, limit = '20', page = '1' } = req.query;
    const body = {
      pageSize: Math.min(parseInt(limit), 50).toString(),
      page,
      language: "zh"
    };
    if (keyword) {
      body.query = keyword;
    }

    const response = await fetch(FINLIGHT_API_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': FINLIGHT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Finlight API error: ${response.status} ${errorText}`);
      return res.status(response.status).json({ message: 'Failed to fetch news from Finlight API' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ message: 'Error fetching news' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
