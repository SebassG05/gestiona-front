import api from '../../../config/api.js';

export const createPortal = async (data) => {
  const response = await api.post('/portals', data);
  return response.data;
};

export const getMyPortals = async () => {
  const response = await api.get('/portals/mine');
  return response.data;
};

export const getInvitationByCode = async (code) => {
  const response = await api.get(`/portals/invitations/${encodeURIComponent(code)}`);
  return response.data;
};

export const respondToInvitation = async ({ code, action }) => {
  const response = await api.post(`/portals/invitations/${encodeURIComponent(code)}/respond`, { action });
  return response.data;
};
