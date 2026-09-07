import api from './axiosInstance';

export const patientsApi = {
  create: (data) => api.post('/patients', data),
  getAll: (params) => api.get('/patients', { params }),
  getOne: (id) => api.get(`/patients/${id}`),
  update: (id, data) => api.put(`/patients/${id}`, data),
  discharge: (id) => api.patch(`/patients/${id}/discharge`),
  getStats: (params) => api.get('/patients/stats', { params }),
};
