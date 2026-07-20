import api from '../../../config/api.js';

export const getPortalFavorites = async (portalId) => {
  const response = await api.get(`/portals/${encodeURIComponent(portalId)}/favorites`);
  return response.data;
};

export const setPortalFavorite = async ({ portalId, entityType, entityId, favorite }) => {
  const response = await api.put(
    `/portals/${encodeURIComponent(portalId)}/favorites/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
    { favorite }
  );
  return response.data;
};
