import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const getStocks = async (symbols = []) => {
  const params = symbols.length > 0 ? { symbols: symbols.join(',') } : {};
  const response = await axios.get(`${API_BASE_URL}/stocks`, { params });
  return response.data;
};

export const getStockKLine = async (id, interval = '1d') => {
  const response = await axios.get(`${API_BASE_URL}/stocks/${id}/kline`, {
    params: { interval }
  });
  return response.data;
};

export const getStockAnalysis = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/stocks/${id}/analysis`);
  return response.data;
};

export const getStockQuant = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/stocks/${id}/quant`);
  return response.data;
};

export const getCryptos = async (symbols = []) => {
  const params = symbols.length > 0 ? { symbols: symbols.join(',') } : {};
  const response = await axios.get(`${API_BASE_URL}/cryptos`, { params });
  return response.data;
};

export const getCryptoKLine = async (id, interval = '1d') => {
  const response = await axios.get(`${API_BASE_URL}/cryptos/${id}/kline`, {
    params: { interval }
  });
  return response.data;
};

export const getCryptoAnalysis = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/cryptos/${id}/analysis`);
  return response.data;
};

export const getCryptoQuant = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/cryptos/${id}/quant`);
  return response.data;
};

export const getNews = async (keyword = '', limit = 20, page = 1) => {
  const params = { limit, page };
  if (keyword.trim()) {
    params.keyword = keyword.trim();
  }
  const response = await axios.get(`${API_BASE_URL}/news`, { params });
  return response.data;
};
