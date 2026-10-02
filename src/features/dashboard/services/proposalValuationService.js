import api from '../../../config/api.js';

const path = (portalId) => `/portals/${encodeURIComponent(portalId)}/valuations`;

export const getValuations = async (portalId, signal) => (await api.get(path(portalId), { signal })).data;
export const saveValuation = async (portalId, data, rowId) => (
  rowId
    ? await api.patch(`${path(portalId)}/${encodeURIComponent(rowId)}`, data)
    : await api.post(path(portalId), data)
).data;
export const deleteValuation = async (portalId, rowId) => (
  await api.delete(`${path(portalId)}/${encodeURIComponent(rowId)}`)
).data;
