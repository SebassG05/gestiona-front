import api from '../../../config/api.js';

export const updateCurrentUser = async ({ username }) => {
  const response = await api.patch('/users/me', { username });
  return response.data;
};
