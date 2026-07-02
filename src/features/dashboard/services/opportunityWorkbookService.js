import api from '../../../config/api.js';

const workbookPath = (portalId) =>
  `/portals/${encodeURIComponent(portalId)}/opportunity-workbooks`;

export const getOpportunityWorkbooks = async (portalId, params = {}) => {
  const response = await api.get(workbookPath(portalId), { params });
  return response.data;
};

export const getOpportunityWorkbook = async ({ portalId, workbookId, params = {} }) => {
  const response = await api.get(
    `${workbookPath(portalId)}/${encodeURIComponent(workbookId)}`,
    { params }
  );
  return response.data;
};

export const searchOpportunityWorkbooks = async ({ portalId, query, category }) => {
  const response = await api.get(`${workbookPath(portalId)}/search`, {
    params: { q: query, category },
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

export const createOpportunityWorkbookRow = async ({ portalId, workbookId, values }) => {
  const response = await api.post(
    `${workbookPath(portalId)}/${encodeURIComponent(workbookId)}/rows`,
    { values }
  );
  return response.data;
};

export const updateOpportunityWorkbookRow = async ({ portalId, workbookId, rowId, values }) => {
  const response = await api.patch(
    `${workbookPath(portalId)}/${encodeURIComponent(workbookId)}/rows/${encodeURIComponent(rowId)}`,
    { values }
  );
  return response.data;
};

export const deleteOpportunityWorkbookRow = async ({ portalId, workbookId, rowId }) => {
  const response = await api.delete(
    `${workbookPath(portalId)}/${encodeURIComponent(workbookId)}/rows/${encodeURIComponent(rowId)}`
  );
  return response.data;
};
