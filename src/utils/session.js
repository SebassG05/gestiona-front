const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const parseJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const normalizedPayload = base64Payload.padEnd(base64Payload.length + ((4 - (base64Payload.length % 4)) % 4), '=');
    const decodedPayload = atob(normalizedPayload);
    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const isTokenExpired = (token) => {
  const payload = parseJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
};

export const hasValidSession = () => {
  const token = getAuthToken();

  if (!token) {
    return false;
  }

  if (isTokenExpired(token)) {
    clearAuthSession();
    return false;
  }

  return true;
};

export const redirectToLogin = (reason = 'expired') => {
  if (window.location.pathname === '/login') {
    return;
  }

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const redirectParam = encodeURIComponent(currentPath);
  window.location.assign(`/login?session=${encodeURIComponent(reason)}&redirect=${redirectParam}`);
};
