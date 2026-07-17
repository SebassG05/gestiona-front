import api from '../../../config/api.js';

const businessTripsPath = (portalId) => `/portals/${encodeURIComponent(portalId)}/business-trips`;

export const getBusinessTrips = async (portalId, params = {}) => {
  const response = await api.get(businessTripsPath(portalId), { params });
  return response.data;
};

export const createBusinessTrip = async ({ portalId, data }) => {
  const response = await api.post(businessTripsPath(portalId), data);
  return response.data;
};

export const updateBusinessTrip = async ({ portalId, tripId, data }) => {
  const response = await api.patch(
    `${businessTripsPath(portalId)}/${encodeURIComponent(tripId)}`,
    data
  );
  return response.data;
};

export const deleteBusinessTrip = async ({ portalId, tripId }) => {
  const response = await api.delete(`${businessTripsPath(portalId)}/${encodeURIComponent(tripId)}`);
  return response.data;
};
