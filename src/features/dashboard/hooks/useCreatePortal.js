import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from '../services/portalService.js';

export const useCreatePortal = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submitPortal = async ({ name, tags, invites }) => {
    setError('');
    setIsLoading(true);

    try {
      const result = await createPortal({ name, tags, invites });
      const portal = result.data;
      navigate(`/dashboard/portal/${portal.id}`);
      return portal;
    } catch (err) {
      const message =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'No se pudo crear el portal';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitPortal,
    error,
    isLoading,
  };
};
