import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('atlas_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('atlas_user')
      localStorage.removeItem('atlas_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Dataset endpoints ──────────────────────────────────────────
export const uploadDataset = (formData, onProgress) =>
  api.post('/data/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded / e.total) * 100))
  })

export const getDatasetInfo = (datasetId) => api.get(`/data/${datasetId}/info`)
export const getDatasetPreview = (datasetId, rows = 20) => api.get(`/data/${datasetId}/preview?rows=${rows}`)
export const listDatasets = () => api.get('/data/list')
export const deleteDataset = (datasetId) => api.delete(`/data/${datasetId}`)

// ── Visualization endpoints ────────────────────────────────────
export const getGraphRecommendations = (datasetId, columns) =>
  api.post('/viz/recommend', { dataset_id: datasetId, columns })

export const generateChart = (payload) => api.post('/viz/generate', payload)

// ── AI Insights endpoints ──────────────────────────────────────
export const getInsights = (datasetId, columns) =>
  api.post('/insights/analyze', { dataset_id: datasetId, columns })

export const nlpQuery = (datasetId, question) =>
  api.post('/insights/nlp', { dataset_id: datasetId, question })

// ── Predictive analytics endpoints ────────────────────────────
export const trainModel = (payload) => api.post('/predict/train', payload)
export const getPredictions = (modelId, data) => api.post(`/predict/${modelId}/predict`, { data })
export const listModels = (datasetId) => api.get(`/predict/models?dataset_id=${datasetId}`)

// ── Report endpoints ───────────────────────────────────────────
export const exportReport = (datasetId, format = 'pdf') =>
  api.get(`/report/${datasetId}/export?format=${format}`, { responseType: 'blob' })

export default api
