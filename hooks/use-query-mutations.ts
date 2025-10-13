import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

/**
 * Smart cache invalidation patterns for common mutations
 * This ensures UI stays in sync after data changes
 */
export function useSmartMutations() {
  const queryClient = useQueryClient()

  // Helper function to invalidate related queries
  const invalidateQueries = (keys: string[]) => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key], exact: false })
    })
  }

  return {
    // Appointment booking - invalidate appointment lists
    useAppointmentBooking: () => useMutation({
      mutationFn: async (appointmentData: any) => {
        const response = await axios.post('/api/appointments', appointmentData)
        return response.data
      },
      onSuccess: () => {
        invalidateQueries([
          'appointments',           // Patient appointment lists
          'upcomingAppointment',   // Home page upcoming appointment
          'admin-notifications',   // Admin notifications (new appointment)
          'userProfile'           // Profile might show appointment count
        ])
      }
    }),

    // Lab booking - invalidate lab related data
    useLabBooking: () => useMutation({
      mutationFn: async (labData: any) => {
        const response = await axios.post('/api/labs', labData)
        return response.data
      },
      onSuccess: () => {
        invalidateQueries([
          'labResults',           // Patient lab results
          'labs',                // Lab packages list
          'admin-notifications', // Admin notifications
          'userProfile'          // Profile updates
        ])
      }
    }),

    // Plan purchase - invalidate profile and plan data
    usePlanPurchase: () => useMutation({
      mutationFn: async (planData: any) => {
        const response = await axios.post('/api/plans/confirmPurchase', planData)
        return response.data
      },
      onSuccess: () => {
        invalidateQueries([
          'userProfile',         // Profile includes plan info
          'plans',              // Plan usage data
          'admin-notifications' // Admin notifications
        ])
      }
    }),

    // Health metrics tracking - invalidate insights
    useHealthMetricsUpdate: () => useMutation({
      mutationFn: async ({ patientId, metrics }: { patientId: string, metrics: any }) => {
        const response = await axios.post(`/api/patient/${patientId}/tracked-values/track`, metrics)
        return response.data
      },
      onSuccess: () => {
        invalidateQueries([
          'insights',           // Health insights page
          'insightsPanel'      // Home page insights panel
        ])
      }
    }),

    // Health insights update - invalidate insights cache
    useHealthInsightsUpdate: () => useMutation({
      mutationFn: async (insightData: any) => {
        const response = await axios.post('/api/insights', insightData)
        return response.data
      },
      onSuccess: () => {
        invalidateQueries([
          'insights',           // Health insights page
          'insightsPanel',     // Home page insights panel
          'health-insights'    // Admin health insights
        ])
      }
    }),

    // Manual cache invalidation for custom cases
    invalidateQueries
  }
}
