import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

/**
 * Smart query hooks with optimized cache strategies
 * Different data types get different cache durations
 */

// For data that changes frequently (notifications, live updates)
export function useRealtimeQuery(key: string[], queryFn: () => Promise<any>) {
  return useQuery({
    queryKey: key,
    queryFn,
    staleTime: 1 * 60 * 1000,      // 1 minute - fresh for short time
    gcTime: 5 * 60 * 1000,         // 5 minutes - keep in memory briefly
    refetchOnWindowFocus: false,   // Prevent excessive refetching
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  })
}

// For data that changes moderately (appointments, lab results)
export function useModerateQuery(key: string[], queryFn: () => Promise<any>) {
  return useQuery({
    queryKey: key,
    queryFn,
    staleTime: 5 * 60 * 1000,      // 5 minutes - reasonable freshness
    gcTime: 15 * 60 * 1000,        // 15 minutes - keep in memory longer
    refetchOnWindowFocus: false,   // Don't refetch on tab switch
    refetchOnMount: false,         // Use cache when component mounts
  })
}

// For data that rarely changes (profiles, plans, static data)
export function useStaticQuery(key: string[], queryFn: () => Promise<any>) {
  return useQuery({
    queryKey: key,
    queryFn,
    staleTime: 15 * 60 * 1000,     // 15 minutes - stays fresh longer
    gcTime: 60 * 60 * 1000,        // 1 hour - keep in memory much longer
    refetchOnWindowFocus: false,   // Never refetch on focus
    refetchOnMount: false,         // Always use cache first
  })
}

// Specialized hooks for common use cases

export function useAppointments(clinicId?: string, patientId?: string) {
  return useModerateQuery(
    ['appointments', clinicId || '', patientId || ''],
    async () => {
      // Ensure we never return undefined
      const result = await (async () => {
      if (!clinicId || !patientId) return { past: [], upcoming: [] }
      
      try {
        const response = await axios.get(`/api/appointments?clinicId=${clinicId}&patientId=${patientId}`)
        
        if (!response.data.success) {
          console.warn('Appointments API returned success: false', response.data);
          return { past: [], upcoming: [] };
        }
        
        // Handle different response structures
        if (response.data.upcomingAppointments !== undefined && response.data.pastAppointments !== undefined) {
          // When patientId is provided, API returns upcomingAppointments and pastAppointments directly
          return {
            past: response.data.pastAppointments || [],
            upcoming: response.data.upcomingAppointments || []
          };
        } else if (response.data.data) {
          // Default case with nested data structure
          return response.data.data;
        } else {
          console.warn('Unexpected API response structure', response.data);
          return { past: [], upcoming: [] };
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        return { past: [], upcoming: [] };
      }
      })();
      
      // Final safeguard - ensure we never return undefined
      return result || { past: [], upcoming: [] };
    }
  )
}

export function useLabResults(patientId?: string) {
  return useModerateQuery(
    ['labResults', patientId || ''],
    async () => {
      if (!patientId) return { scheduled: [], completed: [] }
      const response = await axios.get(`/api/labs?patientId=${patientId}`)
      return response.data
    }
  )
}

export function useNotifications() {
  return useRealtimeQuery(
    ['admin-notifications'],
    async () => {
      const response = await axios.get('/api/admin/optimized/notifications')
      return response.data
    }
  )
}

export function useDoctors(clinicId?: string) {
  return useStaticQuery(
    ['doctors', clinicId || ''],
    async () => {
      if (!clinicId) return []
      const response = await axios.get(`/api/doctors?clinicId=${clinicId}`)
      return response.data
    }
  )
}

export function useLabPackages(clinicId?: string) {
  return useStaticQuery(
    ['labs', clinicId || ''],
    async () => {
      if (!clinicId) return []
      const response = await axios.get(`/api/labs/packages?clinicId=${clinicId}`)
      return response.data
    }
  )
}
