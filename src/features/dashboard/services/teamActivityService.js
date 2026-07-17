import api from '../../../config/api.js';

export const getTeamActivities = async ({ portalId, startDate, endDate }) => {
  const response = await api.get(`/portals/${encodeURIComponent(portalId)}/team-activities`, {
    params: { startDate, endDate },
  });
  return response.data;
};

export const createTeamActivity = async ({ portalId, activity }) => {
  const response = await api.post(
    `/portals/${encodeURIComponent(portalId)}/team-activities`,
    activity
  );
  return response.data;
};

export const updateTeamActivity = async ({ portalId, activityId, activity }) => {
  const response = await api.patch(
    `/portals/${encodeURIComponent(portalId)}/team-activities/${encodeURIComponent(activityId)}`,
    activity
  );
  return response.data;
};

export const deleteTeamActivity = async ({ portalId, activityId }) => {
  const response = await api.delete(
    `/portals/${encodeURIComponent(portalId)}/team-activities/${encodeURIComponent(activityId)}`
  );
  return response.data;
};

export const addTeamActivityComment = async ({ portalId, activityId, message }) => {
  const response = await api.post(
    `/portals/${encodeURIComponent(portalId)}/team-activities/${encodeURIComponent(activityId)}/comments`,
    { message }
  );
  return response.data;
};

export const deleteTeamActivityComment = async ({ portalId, activityId, commentId }) => {
  const response = await api.delete(
    `/portals/${encodeURIComponent(portalId)}/team-activities/${encodeURIComponent(activityId)}/comments/${encodeURIComponent(commentId)}`
  );
  return response.data;
};
