// Free LLM integration using OpenRouter (provides access to free models)
// Alternative: Could also use Ollama for local models

interface LLMResponse {
  summary: string;
  criticalValues: Array<{
    parameter: string;
    value: string;
    unit: string;
    isAbnormal: boolean;
    severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    normalRange: string;
  }>;
}

export class OpenRouterLLM {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
  }

  async analyzeLabReport(extractedText: string, previousReports?: string[]): Promise<LLMResponse> {
    const prompt = this.createAnalysisPrompt(extractedText, previousReports);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'CareDiabetics Lab Analysis'
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-14b:free', // Free Qwen model via OpenRouter
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI assistant specializing in lab report analysis. Provide accurate, clinical interpretations while noting that this is for informational purposes only and should not replace professional medical advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistency
          max_tokens: 2000,
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from LLM');
      }

      return this.parseResponse(content);
    } catch (error) {
      console.error('LLM Analysis Error:', error);
      throw error;
    }
  }

  private createAnalysisPrompt(extractedText: string, previousReports?: string[]): string {
    let prompt = `
Analyze the following lab report and provide a comprehensive medical analysis in JSON format.

Lab Report Text:
${extractedText}

Please provide a response in the following JSON format:
{
  "summary": "A 300-word clinical summary of the lab results, including key findings, potential concerns, and general health implications. Focus on the most important parameters and their clinical significance.",
  "criticalValues": [
    {
      "parameter": "Parameter name",
      "value": "Numeric value",
      "unit": "Unit of measurement",
      "isAbnormal": boolean,
      "severity": "LOW|NORMAL|HIGH|CRITICAL",
      "normalRange": "Normal reference range"
    }
  ]
}

Guidelines:
1. Extract all relevant lab parameters with their values
2. Determine if each value is within normal range
3. Classify severity: LOW (below normal), NORMAL, HIGH (above normal), CRITICAL (dangerously abnormal)
4. Provide a comprehensive but concise summary
5. Focus on clinically significant findings
6. Include potential health implications`;

    if (previousReports && previousReports.length > 0) {
      prompt += `

Previous Reports for Comparison:
${previousReports.join('\n\n')}

Please also include trend analysis in your summary, noting any significant changes from previous reports.`;
    }

    return prompt;
  }

  private parseResponse(content: string): LLMResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (!parsed.summary || !Array.isArray(parsed.criticalValues)) {
        throw new Error('Invalid response structure');
      }

      return {
        summary: parsed.summary,
        criticalValues: parsed.criticalValues.map((cv: any) => ({
          parameter: cv.parameter || '',
          value: cv.value || '',
          unit: cv.unit || '',
          isAbnormal: Boolean(cv.isAbnormal),
          severity: cv.severity || 'NORMAL',
          normalRange: cv.normalRange || ''
        }))
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      // Fallback response
      return {
        summary: content.slice(0, 300) + '...',
        criticalValues: []
      };
    }
  }
}

// Alternative: Ollama integration for local models (completely free)
export class OllamaLLM {
  private baseUrl: string;
  
  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async analyzeLabReport(extractedText: string): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2', // Free local model
          prompt: this.createAnalysisPrompt(extractedText),
          stream: false,
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseResponse(data.response);
    } catch (error) {
      console.error('Ollama Analysis Error:', error);
      throw error;
    }
  }

  private createAnalysisPrompt(extractedText: string): string {
    return `Analyze this lab report and provide a JSON response with summary and critical values:

${extractedText}

Respond in JSON format:
{
  "summary": "300-word clinical analysis",
  "criticalValues": [{"parameter": "", "value": "", "unit": "", "isAbnormal": false, "severity": "NORMAL", "normalRange": ""}]
}`;
  }

  private parseResponse(content: string): LLMResponse {
    // Same parsing logic as OpenRouter
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || content.slice(0, 300),
          criticalValues: parsed.criticalValues || []
        };
      }
    } catch (error) {
      console.error('Parsing error:', error);
    }
    
    return {
      summary: content.slice(0, 300),
      criticalValues: []
    };
  }
}

// Factory function to get the appropriate LLM client
export function getLLMClient(): OpenRouterLLM | OllamaLLM {
  if (process.env.USE_OLLAMA === 'true') {
    return new OllamaLLM(process.env.OLLAMA_URL);
  }
  return new OpenRouterLLM();
}