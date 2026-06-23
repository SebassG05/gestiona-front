import api from '../../../config/api.js';

export const createPortal = async (data) => {
  const response = await api.post('/portals', data);
  return response.data;
};

export const getMyPortals = async () => {
  const response = await api.get('/portals/mine');
  return response.data;
};
