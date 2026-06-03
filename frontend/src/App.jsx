import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Home from './components/Home';
import StockList from './components/StockList';
import StockDetail from './components/StockDetail';
import CryptoList from './components/CryptoList';
import CryptoDetail from './components/CryptoDetail';
import NewsList from './components/NewsList';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
    >
      {theme === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-yellow-400">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-gray-600">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function Navigation() {
  const location = useLocation();
  const isStocks = location.pathname.startsWith('/stock');
  const isCrypto = location.pathname.startsWith('/crypto');
  const isNews = location.pathname.startsWith('/news');

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <Link
          to="/stocks"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isStocks
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          📈 Stock
        </Link>
        <Link
          to="/crypto"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isCrypto
              ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          🪙 Crypto
        </Link>
        <Link
          to="/news"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isNews
              ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          📰 News
        </Link>
      </div>
      <ThemeToggle />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans transition-colors duration-200">
          <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors duration-200">
            <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
              <Link to="/" className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Samous
              </Link>
              <Navigation />
            </div>
          </header>
          <main className="py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/stocks" element={<StockList />} />
              <Route path="/stock/:id" element={<StockDetail />} />
              <Route path="/crypto" element={<CryptoList />} />
              <Route path="/crypto/:id" element={<CryptoDetail />} />
              <Route path="/news" element={<NewsList />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
