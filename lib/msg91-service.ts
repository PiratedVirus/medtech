import axios, { AxiosResponse } from 'axios'

// MSG91 Configuration
const MSG91_CONFIG = {
  baseUrl: 'https://control.msg91.com/api/v5/widget',
  whatsappBaseUrl: 'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/', // Trailing slash required per MSG91 docs
  timeout: 10000, // 10 seconds timeout
  retryAttempts: 2,
  retryDelay: 1000, // 1 second
}

// MSG91 Credentials (from environment)
const getMsg91Credentials = () => ({
  tokenAuth: process.env.MSG91_AUTH_KEY!,
  widgetId: process.env.MSG91_WIDGET_ID!,
})

// MSG91 WhatsApp Credentials (separate authkey for WhatsApp)
const getMsg91WhatsAppCredentials = () => ({
  whatsappAuthKey: process.env.MSG91_WHATSAPP_AUTH_KEY!,
  integratedNumber: process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER!, // WhatsApp Business number registered with MSG91
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
          maxRedirects: 5, // Follow redirects
          validateStatus: (status: number) => status >= 200 && status < 400, // Accept redirects
          ...config
        }
        
        let response: AxiosResponse
        
        if (method === 'GET') {
          response = await axios.get(url, requestConfig)
        } else {
          response = await axios.post(url, data, requestConfig)
        }
        
        return response.data
        
      } catch (error: any) {
        lastError = error as Error
        
        // If it's a redirect (308), try following it manually if axios didn't
        if (error?.response?.status === 308 || error?.response?.status === 301 || error?.response?.status === 302) {
          const redirectUrl = error?.response?.headers?.location
          if (redirectUrl && attempt === 1) {
            try {
              const method = config?.method || 'POST'
              const requestConfig = {
                timeout: MSG91_CONFIG.timeout,
                maxRedirects: 5,
                validateStatus: (status: number) => status >= 200 && status < 400,
                ...config
              }
              
              if (method === 'GET') {
                const response = await axios.get(redirectUrl, requestConfig)
                return response.data
              } else {
                const response = await axios.post(redirectUrl, data, requestConfig)
                return response.data
              }
            } catch (redirectError) {
              lastError = redirectError as Error
            }
          }
        }
        
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
   * Send WhatsApp message with template and attachment
   * @param phoneNumber - Recipient phone number (with country code, e.g., 919876543210)
   * @param templateName - Approved WhatsApp template name
   * @param templateVariables - Array of variables for template (2 variables as per requirement)
   * @param attachmentUrl - URL of the PDF attachment (publicly accessible)
   * @param languageCode - Language code for template (default: en)
   */
  async sendWhatsAppMessage(
    phoneNumber: string,
    templateName: string,
    templateVariables: string[],
    attachmentUrl: string,
    languageCode: string = 'en'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const trimmedPhoneNumber = phoneNumber.replace(/\+/g, '').replace(/\s+/g, '')
      
      // Ensure phone number starts with country code (91 for India)
      const formattedPhone = trimmedPhoneNumber.startsWith('91') 
        ? trimmedPhoneNumber 
        : `91${trimmedPhoneNumber}`

      // Use WhatsApp-specific authkey
      const whatsappCredentials = getMsg91WhatsAppCredentials()
      
      if (!whatsappCredentials.whatsappAuthKey) {
        return { 
          success: false, 
          error: 'MSG91_WHATSAPP_AUTH_KEY not configured' 
        }
      }

      if (!whatsappCredentials.integratedNumber) {
        return { 
          success: false, 
          error: 'MSG91_WHATSAPP_INTEGRATED_NUMBER not configured. This is your WhatsApp Business number registered with MSG91.' 
        }
      }

      // MSG91 WhatsApp API payload structure (v5 format)
      // Per MSG91 docs: requires integrated_number (WhatsApp Business number)
      const payload = {
        recipient_number: formattedPhone, // Recipient phone number with country code
        integrated_number: whatsappCredentials.integratedNumber, // WhatsApp Business number registered with MSG91
        content_type: 'template', // Template message type
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: [
            // Header component with document attachment
            {
              type: 'header',
              parameters: [
                {
                  type: 'document',
                  document: {
                    link: attachmentUrl,
                    filename: 'prescription.pdf'
                  }
                }
              ]
            },
            // Body component with template variables
            {
              type: 'body',
              parameters: templateVariables.map((variable) => ({
                type: 'text',
                text: variable
              }))
            }
          ]
        }
      }

      // Make request to MSG91 WhatsApp API
      // MSG91 WhatsApp API v5 - use lowercase 'authkey' in header per documentation
      const response = await this.makeRequestWithRetry(
        MSG91_CONFIG.whatsappBaseUrl,
        payload,
        {
          headers: {
            'accept': 'application/json',
            'authkey': whatsappCredentials.whatsappAuthKey, // Lowercase 'authkey' per MSG91 docs
            'content-type': 'application/json',
          },
          maxRedirects: 5, // Follow redirects (308 Permanent Redirect)
          validateStatus: (status: number) => {
            // Accept 2xx and 3xx (redirects) as valid
            return status >= 200 && status < 400
          }
        }
      )

      // MSG91 WhatsApp API typically returns success status
      const isSuccess = response.type === 'success' || 
                       response.status === 'success' || 
                       response.request_id !== undefined ||
                       response.id !== undefined // Some responses return id field

      return { 
        success: isSuccess, 
        data: response,
        error: isSuccess ? undefined : (response.message || response.error?.message || 'Failed to send WhatsApp message')
      }

    } catch (error: any) {
      console.error('MSG91 WhatsApp Error:', error)
      
      // Extract more detailed error information
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // If it's an Axios error, try to get response details
      if (error?.response) {
        const status = error.response.status
        const statusText = error.response.statusText
        const responseData = error.response.data
        
        console.error('MSG91 WhatsApp API Response:', {
          status,
          statusText,
          data: responseData
        })
        
        errorMessage = responseData?.message || 
                      responseData?.error?.message || 
                      responseData?.error ||
                      `HTTP ${status}: ${statusText || 'Unauthorized'}`
        
        // Provide helpful error messages
        if (status === 401) {
          errorMessage = `Authentication failed (401). Please check: 1) MSG91_WHATSAPP_AUTH_KEY is correct, 2) IP whitelisting is configured if enabled, 3) Authkey has WhatsApp API access. Error: ${errorMessage}`
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
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
