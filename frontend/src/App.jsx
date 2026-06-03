import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StockList from './components/StockList';
import StockDetail from './components/StockDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto p-4">
            <Link to="/" className="text-xl font-bold text-gray-800 tracking-tight hover:text-blue-600 transition-colors">
              Stock 分析
            </Link>
          </div>
        </header>
        <main className="py-8">
          <Routes>
            <Route path="/" element={<StockList />} />
            <Route path="/stock/:id" element={<StockDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
