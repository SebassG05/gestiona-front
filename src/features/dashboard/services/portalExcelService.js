import api from '../../../config/api.js';

const excelPath = (portalId) => `/portals/${encodeURIComponent(portalId)}/excel-link`;

export const getExcelLinkStatus = async (portalId) => {
  const response = await api.get(`${excelPath(portalId)}/status`);
  return response.data;
};

export const getMicrosoftConnectUrl = async (portalId) => {
  const response = await api.get(`${excelPath(portalId)}/connect-url`);
  return response.data;
};

export const getMicrosoftExcelFiles = async (portalId) => {
  const response = await api.get(`${excelPath(portalId)}/files`);
  return response.data;
};

export const getMicrosoftWorksheets = async ({ portalId, driveId, itemId }) => {
  const response = await api.post(`${excelPath(portalId)}/worksheets`, { driveId, itemId });
  return response.data;
};

export const selectLinkedWorkbook = async ({ portalId, data }) => {
  const response = await api.post(`${excelPath(portalId)}/select`, data);
  return response.data;
};

export const syncLinkedWorkbook = async (portalId) => {
  const response = await api.post(`${excelPath(portalId)}/sync`);
  return response.data;
};

export const getLinkedExcelRows = async (portalId) => {
  const response = await api.get(`${excelPath(portalId)}/rows`);
  return response.data;
};

export const disconnectLinkedWorkbook = async (portalId) => {
  const response = await api.delete(excelPath(portalId));
  return response.data;
};
