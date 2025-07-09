import { useState, useEffect } from 'react';
import { fetchCurrentUser } from '../services/streamingApi';

const useUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        const userData = await fetchCurrentUser();
        setUser(userData);
        setError(null);
      } catch (err) {
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const updateUser = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  };

  const logout = () => {
    setUser(null);
    // Additional logout logic would go here
  };

  return { user, loading, error, updateUser, logout };
};

export default useUser;