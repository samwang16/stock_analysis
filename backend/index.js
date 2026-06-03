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
