import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../../../config/api.js';

export const useGoogleAuth = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loginWithGoogle = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await api.post('/auth/google', {
          accessToken: tokenResponse.access_token,
        });
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        window.location.href = '/dashboard';
      } catch (err) {
        setError(err?.response?.data?.message || 'Error al iniciar sesión con Google');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Error al conectar con Google'),
  });

  return { loginWithGoogle, error, isLoading };
};
