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

    const systemPrompt = `You are a medical AI assistant that extracts structured prescription data from spoken text. 
    Parse the following voice transcript and extract prescription information into a structured JSON format.

    Extract the following information if mentioned:
    - complaints: Array of patient complaints with severity
    - vitals: blood pressure, pulse, height, weight
    - history: allergies, personal history, past medical history, family history
    - systemic examination: general, CVS, RS, CNS
    - medicines: Array of medicines with name, frequency, timing, duration, quantity
    - advice: General advice for the patient
    - testsRequested: Any tests or investigations requested
    - nextVisit: Follow-up visit details

    Return ONLY a valid JSON object with this structure:
    {
      "complaints": [{"text": "complaint description", "severity": "MODERATE", "daysSince": 1}],
      "vitals": {"bloodPressure": "", "pulse": "", "height": "", "weight": ""},
      "history": {"allergies": "", "personalHistory": "", "pastMedicalHistory": "", "familyHistory": ""},
      "systemicExamination": {"general": "", "cvs": "NAD", "rs": "NAD", "cns": "NAD"},
      "medicines": [{"name": "medicine name", "frequency": "1-0-0", "medicineTime": "Post-meal", "duration": 5, "quantity": "10"}],
      "advice": "",
      "testsRequested": "",
      "nextVisit": {"type": "days", "value": 7}
    }

    Guidelines:
    - Use "NAD" (Nothing Abnormal Detected) for normal systemic examination
    - Use standard severity levels: PERFECT, GOOD, MODERATE, RISK, CRITICAL
    - Medicine frequency format: "1-0-0" (morning-afternoon-evening)
    - Medicine timing: Default to "Post-meal" if not specified
    - Medicine duration: Return ONLY numeric value (e.g., 5 instead of "5 days")
    - If information is not mentioned, use empty string or appropriate defaults
    - Be conservative and only extract clearly mentioned information
    - For medicines, try to extract dosage, frequency, and duration if mentioned`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'CareDB Voice Prescription Processing'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
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
        max_tokens: 1000,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenRouter');
    }

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenRouter response:', parseError);
      console.error('Raw response:', responseText);
      
      // Fallback: return a basic structure
      parsedData = {
        complaints: [],
        vitals: { bloodPressure: "", pulse: "", height: "", weight: "" },
        history: { allergies: "", personalHistory: "", pastMedicalHistory: "", familyHistory: "" },
        systemicExamination: { general: "", cvs: "NAD", rs: "NAD", cns: "NAD" },
        medicines: [],
        advice: "",
        testsRequested: "",
        nextVisit: { type: "days", value: 7 }
      };
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
