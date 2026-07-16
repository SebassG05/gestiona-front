import api from '../../../config/api.js';

export const getTeamVacations = async ({ portalId, startDate, endDate }) => {
  const response = await api.get(`/portals/${encodeURIComponent(portalId)}/team-vacations`, {
    params: { startDate, endDate },
  });
  return response.data;
};

export const createTeamVacation = async ({ portalId, vacation }) => {
  const response = await api.post(
    `/portals/${encodeURIComponent(portalId)}/team-vacations`,
    vacation
  );
  return response.data;
};

export const deleteTeamVacation = async ({ portalId, vacationId }) => {
  const response = await api.delete(
    `/portals/${encodeURIComponent(portalId)}/team-vacations/${encodeURIComponent(vacationId)}`
  );
  return response.data;
};
