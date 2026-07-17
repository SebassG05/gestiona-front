import api from '../../../config/api.js';

const path = (portalId, proposalId) =>
  `/portals/${encodeURIComponent(portalId)}/proposals/${encodeURIComponent(proposalId)}/control`;

export const getProposalControl = async ({ portalId, proposalId }) => {
  const response = await api.get(path(portalId, proposalId));
  return response.data;
};

export const saveProposalControl = async ({ portalId, proposalId, items }) => {
  const response = await api.put(path(portalId, proposalId), { items });
  return response.data;
};
