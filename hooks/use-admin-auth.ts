import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface AdminUser {
  id: number;
  name: string;
  email: string | null;
  role: string;
  clinicId: number | null;
  clinic?: {
    id: number;
    name: string;
  } | null;
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