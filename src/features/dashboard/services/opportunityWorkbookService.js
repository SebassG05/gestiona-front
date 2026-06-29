import api from '../../../config/api.js';

const workbookPath = (portalId) =>
  `/portals/${encodeURIComponent(portalId)}/opportunity-workbooks`;

export const getOpportunityWorkbooks = async (portalId) => {
  const response = await api.get(workbookPath(portalId));
  return response.data;
};

export const getOpportunityWorkbook = async ({ portalId, workbookId }) => {
  const response = await api.get(
    `${workbookPath(portalId)}/${encodeURIComponent(workbookId)}`
  );
  return response.data;
};

export const searchOpportunityWorkbooks = async ({ portalId, query }) => {
  const response = await api.get(`${workbookPath(portalId)}/search`, {
    params: { q: query },
  });
  return response.data;
};

export const importOpportunityWorkbook = async ({ portalId, data }) => {
  const response = await api.post(`${workbookPath(portalId)}/import`, data);
  return response.data;
};

export const deleteOpportunityWorkbook = async ({ portalId, workbookId }) => {
  const response = await api.delete(
    `${workbookPath(portalId)}/${encodeURIComponent(workbookId)}`
  );
  return response.data;
};
