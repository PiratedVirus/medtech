import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `Extract prescription data from voice transcript. Do not return anything else. Strictly return ONLY valid JSON:

{
  "complaints": [{"text": "complaint", "severity": "MODERATE", "daysSince": 1}],
  "vitals": {"bloodPressure": "", "pulse": "", "height": "", "weight": ""},
  "history": {"allergies": "", "personalHistory": "", "pastMedicalHistory": "", "familyHistory": ""},
  "systemicExamination": {"general": "", "cvs": "NAD", "rs": "NAD", "cns": "NAD"},
  "medicines": [{"name": "medicine", "frequency": "1-0-0", "medicineTime": "Post-meal", "duration": 5, "quantity": ""}],
  "advice": "",
  "testsRequested": "",
  "nextVisit": {"type": "days", "value": 7}
}

Rules:
- Severity: PERFECT, GOOD, MODERATE, RISK, CRITICAL
- Frequency: "1-0-0" format (morning-afternoon-evening)
- Duration: numeric only (5 not "5 days")
- Vitals: no units (64 not "64 bpm")
- Default medicineTime: "Post-meal"
- Use "NAD" for normal examination
- Extract only clearly mentioned information
- If no specific date mentioned, use default nextVisit: {"type": "days", "value": 7}
- Keep response concise and focused`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'CareDB Voice Prescription Processing'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please parse this voice transcript and extract prescription data:\n\n${transcript}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
        top_p: 0.9,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenRouter response data:', JSON.stringify(data, null, 2));
    
    const responseText = data.choices[0]?.message?.content;
    const finishReason = data.choices[0]?.finish_reason;
    
    if (!responseText) {
      console.error('No response text found in OpenRouter response:', data);
      
      // Check if it's a token limit issue
      if (finishReason === 'length') {
        return NextResponse.json(
          { error: 'Voice input too long. Please speak more concisely and try again.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'AI model could not process your voice input. Please try speaking more clearly or try again.' },
        { status: 500 }
      );
    }

    // Extract JSON from the response (handle markdown formatting)
    const extractJsonFromResponse = (text: string): string => {
      // First, try to find JSON within markdown code blocks
      const jsonBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonBlockMatch) {
        return jsonBlockMatch[1];
      }
      
      // Try to find JSON object directly in the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return jsonMatch[0];
      }
      
      // If no JSON found, return the original text
      return text;
    };

    // Clean JSON by fixing common issues
    const cleanJsonString = (jsonStr: string): string => {
      // Fix arithmetic expressions like "7 * 365" to actual numbers
      return jsonStr.replace(/(\d+)\s*\*\s*(\d+)/g, (match, num1, num2) => {
        return (parseInt(num1) * parseInt(num2)).toString();
      });
    };

    // Parse the JSON response
    let parsedData;
    try {
      const jsonText = extractJsonFromResponse(responseText);
      const cleanedJsonText = cleanJsonString(jsonText);
      parsedData = JSON.parse(cleanedJsonText);
      
      // Validate that we have the required structure
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Invalid response structure');
      }
      
      // Check if we have at least some meaningful data
      const hasData = parsedData.complaints?.length > 0 || 
                     parsedData.medicines?.length > 0 || 
                     parsedData.advice || 
                     parsedData.testsRequested ||
                     (parsedData.vitals && (parsedData.vitals.bloodPressure || parsedData.vitals.pulse || parsedData.vitals.height || parsedData.vitals.weight));
      
      if (!hasData) {
        throw new Error('No meaningful data extracted from voice input');
      }
      
    } catch (parseError) {
      console.error('Failed to parse OpenRouter response:', parseError);
      console.error('Raw response:', responseText);
      return NextResponse.json(
        { error: 'AI model generated invalid response. Please try speaking more clearly or try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Error processing voice prescription with OpenRouter:', error);
    return NextResponse.json(
      { error: 'Failed to process voice input' },
      { status: 500 }
    );
  }
}
