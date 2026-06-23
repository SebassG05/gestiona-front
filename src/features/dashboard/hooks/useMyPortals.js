import { useEffect, useState } from 'react';
import { deletePortal, getMyPortals } from '../services/portalService.js';

export const useMyPortals = () => {
  const [portals, setPortals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingPortalId, setDeletingPortalId] = useState('');

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

  const removePortal = async (portalId) => {
    setError('');
    setDeletingPortalId(portalId);

    try {
      await deletePortal(portalId);
      setPortals((currentPortals) => currentPortals.filter((portal) => portal.id !== portalId));
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar el portal');
    } finally {
      setDeletingPortalId('');
    }
  };

  return { portals, isLoading, error, deletingPortalId, removePortal };
};
