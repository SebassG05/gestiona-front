import api from '../../../config/api.js';

export const createProposal = async ({ portalId, data }) => {
  const response = await api.post(`/portals/${encodeURIComponent(portalId)}/proposals`, data);
  return response.data;
};
