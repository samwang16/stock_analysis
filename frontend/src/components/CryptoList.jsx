import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCryptos } from '../api';

const popularCryptos = [
  { symbol: 'BTC-USD', name: 'Bitcoin' },
  { symbol: 'ETH-USD', name: 'Ethereum' },
  { symbol: 'BNB-USD', name: 'BNB' },
  { symbol: 'SOL-USD', name: 'Solana' },
  { symbol: 'XRP-USD', name: 'XRP' },
  { symbol: 'ADA-USD', name: 'Cardano' },
  { symbol: 'DOGE-USD', name: 'Dogecoin' },
  { symbol: 'DOT-USD', name: 'Polkadot' },
  { symbol: 'AVAX-USD', name: 'Avalanche' },
  { symbol: 'MATIC-USD', name: 'Polygon' }
];

const CryptoList = () => {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('cryptoFavorites');
    return saved ? JSON.parse(saved) : ['BTC-USD', 'ETH-USD', 'SOL-USD'];
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('cryptoFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const fetchCryptos = async () => {
      setLoading(true);
      try {
        if (favorites.length > 0) {
          const data = await getCryptos(favorites);
          setCryptos(data);
        } else {
          setCryptos([]);
        }
      } catch (error) {
        console.error('Failed to fetch cryptos', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCryptos();
  }, [favorites]);

  if (loading) return <div className="text-center p-8 dark:text-gray-300">加载中...</div>;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const cryptoCode = searchQuery.trim().toUpperCase();
      const symbol = cryptoCode.includes('-') ? cryptoCode : `${cryptoCode}-USD`;
      navigate(`/crypto/${symbol}`);
    }
  };

  const toggleFavorite = (e, cryptoId) => {
    e.preventDefault();
    setFavorites(prev => 
      prev.includes(cryptoId) 
        ? prev.filter(id => id !== cryptoId)
        : [...prev, cryptoId]
    );
  };

  const addPopularCrypto = (symbol) => {
    if (!favorites.includes(symbol)) {
      setFavorites(prev => [...prev, symbol]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入虚拟货币代码 (如 BTC)"
            className="flex-1 sm:flex-none border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors whitespace-nowrap"
          >
            查询
          </button>
        </form>
      </div>

      {/* 热门虚拟货币快捷添加 */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">热门虚拟货币</h3>
        <div className="flex flex-wrap gap-2">
          {popularCryptos.map(crypto => (
            <button
              key={crypto.symbol}
              onClick={() => addPopularCrypto(crypto.symbol)}
              disabled={favorites.includes(crypto.symbol)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                favorites.includes(crypto.symbol)
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 cursor-pointer'
              }`}
            >
              {crypto.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {cryptos.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">暂无收藏的虚拟货币，请在上方输入代码查询或点击热门货币添加。</p>
          </div>
        ) : (
          cryptos.map(crypto => (
            <Link
              key={crypto.id}
              to={`/crypto/${crypto.id}`}
              className="block p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{crypto.name}</h2>
                    <button
                      onClick={(e) => toggleFavorite(e, crypto.id)}
                      className="focus:outline-none transition-transform hover:scale-110"
                      title={favorites.includes(crypto.id) ? "取消收藏" : "收藏"}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill={favorites.includes(crypto.id) ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        className={`w-6 h-6 ${favorites.includes(crypto.id) ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{crypto.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-100">${crypto.price.toFixed(2)}</p>
                  <p className={`text-sm font-medium ${crypto.change.startsWith('+') ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                    {crypto.change}
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

export default CryptoList;
