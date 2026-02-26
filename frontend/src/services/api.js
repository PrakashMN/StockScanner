import axios from 'axios'

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Auth
export const register = (data) => api.post('/api/auth/register', data)
export const login = (data) => api.post('/api/auth/login', data)

// Stocks
export const analyzeStock = async (symbol) => {
  const response = await api.post('/api/stocks/analyze', { symbol })
  return response.data
}

export const searchStocks = async (query) => {
  const response = await api.get(`/api/stocks/search?q=${encodeURIComponent(query)}`)
  return response.data
}

export default api
