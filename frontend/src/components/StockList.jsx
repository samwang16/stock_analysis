import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStocks } from '../api';

const marketOptions = [
  { value: '', label: '美股' },
  { value: '.HK', label: '港股' },
  { value: '.SS', label: '沪市' },
  { value: '.SZ', label: '深市' }
];

const StockList = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('stockFavorites');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('stockFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true);
      try {
        if (favorites.length > 0) {
          const data = await getStocks(favorites);
          setStocks(data);
        } else {
          setStocks([]);
        }
      } catch (error) {
        console.error('Failed to fetch stocks', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, [favorites]);

  if (loading) return <div className="text-center p-8 dark:text-gray-300">加载中...</div>;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const stockCode = searchQuery.trim().toUpperCase() + selectedMarket;
      navigate(`/stock/${stockCode}`);
    }
  };

  const toggleFavorite = (e, stockId) => {
    e.preventDefault();
    setFavorites(prev => 
      prev.includes(stockId) 
        ? prev.filter(id => id !== stockId)
        : [...prev, stockId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入股票代码"
            className="flex-1 sm:flex-none border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {marketOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            查询
          </button>
        </form>
      </div>
      <div className="grid gap-4">
        {stocks.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">暂无收藏的股票，请在上方输入代码查询并收藏。</p>
          </div>
        ) : (
          stocks.map(stock => (
            <Link
              key={stock.id}
              to={`/stock/${stock.id}`}
              className="block p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{stock.name}</h2>
                    <button
                      onClick={(e) => toggleFavorite(e, stock.id)}
                      className="focus:outline-none transition-transform hover:scale-110"
                      title={favorites.includes(stock.id) ? "取消收藏" : "收藏"}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill={favorites.includes(stock.id) ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        className={`w-6 h-6 ${favorites.includes(stock.id) ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stock.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-100">${stock.price.toFixed(2)}</p>
                  <p className={`text-sm font-medium ${stock.change.startsWith('+') ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                    {stock.change}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default StockList;
