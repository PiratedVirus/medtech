import axios, { AxiosResponse } from 'axios'

// MSG91 Configuration
const MSG91_CONFIG = {
  baseUrl: 'https://control.msg91.com/api/v5/widget',
  timeout: 10000, // 10 seconds timeout
  retryAttempts: 2,
  retryDelay: 1000, // 1 second
}

// MSG91 Credentials (from environment)
const getMsg91Credentials = () => ({
  tokenAuth: process.env.MSG91_AUTH_KEY!,
  widgetId: process.env.MSG91_WIDGET_ID!,
})

/**
 * Optimized MSG91 OTP Service with caching and rate limiting
 */
export class Msg91Service {
  private static instance: Msg91Service
  private requestCache = new Map<string, { timestamp: number; response: any }>()
  
  static getInstance(): Msg91Service {
    if (!Msg91Service.instance) {
      Msg91Service.instance = new Msg91Service()
    }
    return Msg91Service.instance
  }

  /**
   * Send OTP with optimizations
   */
  async sendOtp(phoneNumber: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const trimmedPhoneNumber = phoneNumber.replace(/\+/g, '').replace(/\s+/g, '')
      
      // Check cache first
      const cacheKey = `send_otp_${trimmedPhoneNumber}`
      const cached = this.requestCache.get(cacheKey)
      
      if (cached && (Date.now() - cached.timestamp) < 30000) { // 30 seconds cache
        return { success: true, data: cached.response }
      }

      const credentials = getMsg91Credentials()
      const payload = {
        tokenAuth: credentials.tokenAuth,
        widgetId: credentials.widgetId,
        identifier: trimmedPhoneNumber
      }

      // Optimized request with timeout and retry
      const response = await this.makeRequestWithRetry(
        `${MSG91_CONFIG.baseUrl}/sendOtp`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )

      // Cache successful response
      if (response.type === 'success') {
        this.requestCache.set(cacheKey, {
          timestamp: Date.now(),
          response: response
        })
      }

      return { 
        success: response.type === 'success', 
        data: response,
        error: response.type !== 'success' ? response.message : undefined
      }

    } catch (error) {
      console.error('MSG91 Send OTP Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Verify OTP with optimizations
   */
  async verifyOtp(phoneNumber: string, otpCode: string, reqId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const trimmedPhoneNumber = phoneNumber.replace(/\+/g, '').replace(/\s+/g, '')
      const credentials = getMsg91Credentials()
      
      // MSG91 Widget verify endpoint uses POST with query parameters
      const url = `${MSG91_CONFIG.baseUrl}/verifyOtp?otp=${otpCode}&mobile=${trimmedPhoneNumber}&widgetId=${credentials.widgetId}&reqId=${reqId}`
      
      const response = await this.makeRequestWithRetry(
        url,
        {}, // Empty body for POST request
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'tokenAuth': credentials.tokenAuth
          }
        }
      )

      return { 
        success: response.type === 'success' || response.status === 'success', 
        data: response,
        error: response.type !== 'success' && response.status !== 'success' ? response.message : undefined
      }

    } catch (error) {
      console.error('MSG91 Verify OTP Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Make request with retry logic
   */
  private async makeRequestWithRetry(
    url: string, 
    data?: any, 
    config?: any
  ): Promise<any> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= MSG91_CONFIG.retryAttempts; attempt++) {
      try {
        const method = config?.method || 'POST'
        const requestConfig = {
          timeout: MSG91_CONFIG.timeout,
          ...config
        }
        
        let response: AxiosResponse
        
        if (method === 'GET') {
          response = await axios.get(url, requestConfig)
        } else {
          response = await axios.post(url, data, requestConfig)
        }
        
        return response.data
        
      } catch (error) {
        lastError = error as Error
        
        if (attempt < MSG91_CONFIG.retryAttempts) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, MSG91_CONFIG.retryDelay * attempt))
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries')
  }

  /**
   * Clear cache for phone number
   */
  clearCache(phoneNumber: string): void {
    const trimmedPhoneNumber = phoneNumber.replace(/\+/g, '').replace(/\s+/g, '')
    const cacheKey = `send_otp_${trimmedPhoneNumber}`
    this.requestCache.delete(cacheKey)
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys())
    }
  }
}

// Export singleton instance
export const msg91Service = Msg91Service.getInstance()
