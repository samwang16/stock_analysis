import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ReactApexChart from 'react-apexcharts';
import { getCryptoKLine, getCryptoAnalysis, getCryptoQuant } from '../api';

const intervalOptions = [
  { value: '5m', label: '5分钟' },
  { value: '15m', label: '15分钟' },
  { value: '30m', label: '30分钟' },
  { value: '1h', label: '1小时' },
  { value: '1d', label: '1天' },
  { value: '5d', label: '5天' },
  { value: '1wk', label: '1周' },
  { value: '1mo', label: '1月' }
];

const CryptoDetail = () => {
  const [selectedInterval, setSelectedInterval] = useState('1d');
  const { id } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [klineData, setKlineData] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [quantData, setQuantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('cryptoFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cryptoFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [kline, analysisData, quant] = await Promise.all([
          getCryptoKLine(id, selectedInterval),
          getCryptoAnalysis(id),
          getCryptoQuant(id)
        ]);
        setKlineData(kline);
        setAnalysis(analysisData);
        setQuantData(quant);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, selectedInterval]);

  if (loading) return <div className="text-center p-8">加载中...</div>;

  const chartSeries = [{
    name: 'K线图',
    data: klineData.map(item => ({
      x: new Date(item.date),
      y: [item.open, item.high, item.low, item.close]
    }))
  }];

  const chartOptions = {
    chart: {
      type: 'candlestick',
      height: 400,
      background: 'transparent',
      foreColor: isDark ? '#d1d5db' : '#374151'
    },
    title: {
      text: `${analysis?.name} (${id}) 历史趋势`,
      align: 'left',
      style: {
        color: isDark ? '#f3f4f6' : '#1f2937'
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280'
        }
      },
      axisBorder: {
        color: isDark ? '#4b5563' : '#e5e7eb'
      },
      axisTicks: {
        color: isDark ? '#4b5563' : '#e5e7eb'
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280'
        }
      },
      tooltip: {
        enabled: true
      }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#f3f4f6'
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#ef4444',
          downward: '#22c55e'
        }
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light'
    }
  };

  const toggleFavorite = () => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {analysis && (
        <div className="mb-8 flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{analysis.name} ({analysis.cryptoId})</h1>
          <button
            onClick={toggleFavorite}
            className="focus:outline-none transition-transform hover:scale-110 mb-2"
            title={favorites.includes(id) ? "取消收藏" : "收藏"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill={favorites.includes(id) ? "currentColor" : "none"} 
              stroke="currentColor" 
              className={`w-8 h-8 ${favorites.includes(id) ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
        <div className="flex justify-end mb-4">
          <select 
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
          >
            {intervalOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <ReactApexChart 
          options={chartOptions} 
          series={chartSeries} 
          type="candlestick" 
          height={400} 
        />
      </div>

      {analysis && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">近期交易分析</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">综合摘要</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{analysis.summary}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">近期趋势</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{analysis.trend}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">支撑位</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">${analysis.supportLevel}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">阻力位</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">${analysis.resistanceLevel}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">操作建议</p>
              <p className="font-bold text-lg text-orange-600 dark:text-orange-400">{analysis.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {quantData && quantData.dimensions && quantData.dimensions.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">量化评分分析</h2>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black" style={{ color: quantData.suggestionColor === 'green' ? '#22c55e' : quantData.suggestionColor === 'blue' ? '#3b82f6' : quantData.suggestionColor === 'red' ? '#ef4444' : '#f97316' }}>
                {quantData.totalScore}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
              <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: quantData.suggestionColor === 'green' ? '#22c55e' : quantData.suggestionColor === 'blue' ? '#3b82f6' : quantData.suggestionColor === 'red' ? '#ef4444' : '#f97316' }}>
                {quantData.suggestion}
              </span>
            </div>
          </div>

          {/* 评分进度条 */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
              <div 
                className="h-4 rounded-full transition-all duration-500"
                style={{ 
                  width: `${quantData.totalScore}%`,
                  backgroundColor: quantData.suggestionColor === 'green' ? '#22c55e' : quantData.suggestionColor === 'blue' ? '#3b82f6' : quantData.suggestionColor === 'red' ? '#ef4444' : '#f97316'
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 不建议买入</span>
              <span>40 观望</span>
              <span>60 可以买入</span>
              <span>80 强烈买入</span>
              <span>100</span>
            </div>
          </div>

          {/* 评分表 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">分析维度</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">权重</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">得分</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 w-1/3">评分条</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">分析说明</th>
                </tr>
              </thead>
              <tbody>
                {quantData.dimensions.map((dim, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{dim.name}</td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{dim.weight}</td>
                    <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">{dim.score}/{dim.maxScore}</td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(dim.score / dim.maxScore) * 100}%`,
                            backgroundColor: (dim.score / dim.maxScore) >= 0.7 ? '#22c55e' : (dim.score / dim.maxScore) >= 0.5 ? '#3b82f6' : (dim.score / dim.maxScore) >= 0.3 ? '#f97316' : '#ef4444'
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{dim.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 技术指标详情 */}
          {quantData.indicators && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-4">技术指标详情</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Object.entries(quantData.indicators).map(([key, value]) => {
                  if (value === null || value === undefined) return null;
                  const labelMap = {
                    'MA5': 'MA5（5日均线）',
                    'MA20': 'MA20（20日均线）',
                    'MA60': 'MA60（60日均线）',
                    'RSI': 'RSI（相对强弱）',
                    'MACD_DIF': 'MACD DIF',
                    'MACD_Hist': 'MACD 柱状',
                    'Bollinger_Upper': '布林上轨',
                    'Bollinger_Middle': '布林中轨',
                    'Bollinger_Lower': '布林下轨',
                    'ATR': 'ATR（真实波幅）',
                    'Price_Position': '价格位置(%)'
                  };
                  const formatVal = key === 'Price_Position' ? `${value}%` : (key === 'RSI' ? value : `$${value}`);
                  return (
                    <div key={key} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{labelMap[key] || key}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatVal}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CryptoDetail;
