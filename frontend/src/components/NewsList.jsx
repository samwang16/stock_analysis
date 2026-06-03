import { useState, useEffect } from 'react';
import { getNews } from '../api';

const NewsList = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const data = await getNews(keyword, 20, page);
        const items = Array.isArray(data) ? data : (data.articles || data.data || []);
        if (page === 1) {
          setArticles(items);
        } else {
          setArticles(prev => [...prev, ...items]);
        }
        setHasMore(items.length >= 20);
      } catch (error) {
        console.error('Failed to fetch news', error);
        if (page === 1) setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [keyword, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchKeyword(searchInput);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return '刚刚';
      if (diffMins < 60) return `${diffMins} 分钟前`;
      if (diffHours < 24) return `${diffHours} 小时前`;
      if (diffDays < 7) return `${diffDays} 天前`;
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">📰 最新新闻</h1>
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索关键词..."
            className="flex-1 sm:flex-none border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            搜索
          </button>
        </form>
      </div>

      {loading && page === 1 ? (
        <div className="text-center p-8 dark:text-gray-300">加载中...</div>
      ) : articles.length === 0 ? (
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            {keyword ? `未找到与「${keyword}」相关的新闻` : '暂无新闻数据'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {articles.map((article, index) => (
            <a
              key={article.id || article.url || index}
              href={article.url || article.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
                    {article.title || article.headline || '无标题'}
                  </h2>
                  {(article.image || (article.images && article.images.length > 0)) && (
                    <img
                      src={article.image || article.images[0]}
                      alt=""
                      className="w-24 h-16 object-cover rounded-md flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
                {(article.summary || article.description || article.content) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {article.summary || article.description || article.content}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  {article.source && (
                    <span className="inline-flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                      </svg>
                      {article.source?.name || article.source}
                    </span>
                  )}
                  {(article.publishDate || article.publishedAt || article.date || article.createdAt) && (
                    <span className="inline-flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                      </svg>
                      {formatTime(article.publishDate || article.publishedAt || article.date || article.createdAt)}
                    </span>
                  )}
                  {article.ticker && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {article.ticker}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}

          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsList;
