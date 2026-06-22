import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService.js';

export const useRegister = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const register = async (formData) => {
    setError(null);
    setIsLoading(true);
    try {
      await registerUser(formData);
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || 'Error al registrar usuario';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { register, error, isLoading };
};
