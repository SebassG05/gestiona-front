import api from '../../../config/api.js';

const relationPath = (portalId, proposalId, resource) =>
  `/portals/${encodeURIComponent(portalId)}/proposals/${encodeURIComponent(
    proposalId
  )}/${encodeURIComponent(resource)}`;

export const getProposalRelations = async ({ portalId, proposalId, resource }) => {
  const response = await api.get(relationPath(portalId, proposalId, resource));
  return response.data;
};

export const createProposalRelation = async ({ portalId, proposalId, resource, data }) => {
  const response = await api.post(relationPath(portalId, proposalId, resource), data);
  return response.data;
};

export const updateProposalRelation = async ({
  portalId,
  proposalId,
  resource,
  itemId,
  data,
}) => {
  const response = await api.patch(
    `${relationPath(portalId, proposalId, resource)}/${encodeURIComponent(itemId)}`,
    data
  );
  return response.data;
};

export const deleteProposalRelation = async ({
  portalId,
  proposalId,
  resource,
  itemId,
}) => {
  const response = await api.delete(
    `${relationPath(portalId, proposalId, resource)}/${encodeURIComponent(itemId)}`
  );
  return response.data;
};
