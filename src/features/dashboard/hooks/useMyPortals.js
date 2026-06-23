import { useEffect, useState } from 'react';
import { getMyPortals } from '../services/portalService.js';

export const useMyPortals = () => {
  const [portals, setPortals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadPortals = async () => {
      try {
        setIsLoading(true);
        const response = await getMyPortals();
        if (!active) return;
        setPortals(response.data || []);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || 'No se pudieron cargar tus portales');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadPortals();

    return () => {
      active = false;
    };
  }, []);

  return { portals, isLoading, error };
};
