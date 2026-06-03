import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          欢迎来到 Samous
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-xl">
          您的一站式金融分析平台，实时追踪股票与虚拟货币行情，助您把握投资先机。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/stocks"
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-sm"
          >
            📈 股票行情
          </Link>
          <Link
            to="/crypto"
            className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-lg font-medium shadow-sm"
          >
            🪙 虚拟货币
          </Link>
          <Link
            to="/news"
            className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium shadow-sm"
          >
            📰 最新新闻
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
