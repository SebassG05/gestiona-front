import api from '../../../config/api.js';

export const getPortalProposals = async (portalId, params = {}) => {
  const response = await api.get(`/portals/${encodeURIComponent(portalId)}/proposals`, {
    params,
  });
  return response.data;
};

export const getProposal = async ({ portalId, proposalId }) => {
  const response = await api.get(
    `/portals/${encodeURIComponent(portalId)}/proposals/${encodeURIComponent(proposalId)}`
  );
  return response.data;
};

export const createProposal = async ({ portalId, data }) => {
  const response = await api.post(`/portals/${encodeURIComponent(portalId)}/proposals`, data);
  return response.data;
};

export const importProposals = async ({ portalId, proposals }) => {
  const response = await api.post(`/portals/${encodeURIComponent(portalId)}/proposals/import`, {
    proposals,
  });
  return response.data;
};

export const updateProposal = async ({ portalId, proposalId, data }) => {
  const response = await api.patch(
    `/portals/${encodeURIComponent(portalId)}/proposals/${encodeURIComponent(proposalId)}`,
    data
  );
  return response.data;
};

export const deleteProposal = async ({ portalId, proposalId }) => {
  const response = await api.delete(
    `/portals/${encodeURIComponent(portalId)}/proposals/${encodeURIComponent(proposalId)}`
  );
  return response.data;
};

export const deleteAllProposals = async (portalId) => {
  const response = await api.delete(`/portals/${encodeURIComponent(portalId)}/proposals`);
  return response.data;
};
