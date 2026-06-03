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
