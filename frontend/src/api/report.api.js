import api from '../lib/axios'

export const reportApi = {
  createReport: (data) => api.post('/reports', data),
}
