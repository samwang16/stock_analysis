import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import StockList from './components/StockList';
import StockDetail from './components/StockDetail';
import CryptoList from './components/CryptoList';
import CryptoDetail from './components/CryptoDetail';

function Navigation() {
  const location = useLocation();
  const isCrypto = location.pathname.startsWith('/crypto');

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      <Link
        to="/"
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          !isCrypto ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        📈 股票
      </Link>
      <Link
        to="/crypto"
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isCrypto ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        🪙 虚拟货币
      </Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-gray-800 tracking-tight hover:text-blue-600 transition-colors">
              Finance Analysis
            </Link>
            <Navigation />
          </div>
        </header>
        <main className="py-8">
          <Routes>
            <Route path="/" element={<StockList />} />
            <Route path="/stock/:id" element={<StockDetail />} />
            <Route path="/crypto" element={<CryptoList />} />
            <Route path="/crypto/:id" element={<CryptoDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
