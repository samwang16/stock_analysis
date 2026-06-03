import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Welcome to Samous
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-xl">
          Your one-stop financial analysis platform, tracking stock and crypto prices in real-time, helping you make informed decisions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/stocks"
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-sm"
          >
            📈 Stock Market
          </Link>
          <Link
            to="/crypto"
            className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-lg font-medium shadow-sm"
          >
            🪙 Crypto Market
          </Link>
          <Link
            to="/news"
            className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium shadow-sm"
          >
            📰 News
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
