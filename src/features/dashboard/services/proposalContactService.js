import api from '../../../config/api.js';

const contactsPath = (portalId, proposalId) =>
  `/portals/${encodeURIComponent(portalId)}/proposals/${encodeURIComponent(proposalId)}/contacts`;

export const getProposalContacts = async ({ portalId, proposalId }) => {
  const response = await api.get(contactsPath(portalId, proposalId));
  return response.data;
};

export const createProposalContact = async ({ portalId, proposalId, data }) => {
  const response = await api.post(contactsPath(portalId, proposalId), data);
  return response.data;
};

export const updateProposalContact = async ({ portalId, proposalId, contactId, data }) => {
  const response = await api.patch(
    `${contactsPath(portalId, proposalId)}/${encodeURIComponent(contactId)}`,
    data
  );
  return response.data;
};

export const deleteProposalContact = async ({ portalId, proposalId, contactId }) => {
  const response = await api.delete(
    `${contactsPath(portalId, proposalId)}/${encodeURIComponent(contactId)}`
  );
  return response.data;
};
