import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import { getCryptoKLine, getCryptoAnalysis } from '../api';

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
  const [klineData, setKlineData] = useState([]);
  const [analysis, setAnalysis] = useState(null);
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
        const [kline, analysisData] = await Promise.all([
          getCryptoKLine(id, selectedInterval),
          getCryptoAnalysis(id)
        ]);
        setKlineData(kline);
        setAnalysis(analysisData);
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
      height: 400
    },
    title: {
      text: `${analysis?.name} (${id}) 历史趋势`,
      align: 'left'
    },
    xaxis: {
      type: 'datetime'
    },
    yaxis: {
      tooltip: {
        enabled: true
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#ef4444',
          downward: '#22c55e'
        }
      }
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{analysis.name} ({analysis.cryptoId})</h1>
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

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-end mb-4">
          <select 
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">近期交易分析</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm mb-1">综合摘要</p>
              <p className="font-medium text-gray-800">{analysis.summary}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">近期趋势</p>
              <p className="font-medium text-gray-800">{analysis.trend}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">支撑位</p>
              <p className="font-medium text-gray-800">${analysis.supportLevel}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">阻力位</p>
              <p className="font-medium text-gray-800">${analysis.resistanceLevel}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-500 text-sm mb-1">操作建议</p>
              <p className="font-bold text-lg text-orange-600">{analysis.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoDetail;
