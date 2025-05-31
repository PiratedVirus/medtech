import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAdminAuth() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await axios.get('/api/admin/auth/me');
        if (response.data.success) {
          setAdmin(response.data.user);
        }
      } catch (error) {
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  const logout = async () => {
    try {
      await axios.post('/api/admin/auth/logout');
      setAdmin(null);
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    admin,
    loading,
    logout,
    isAuthenticated: !!admin,
  };
} 