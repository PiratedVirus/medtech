import pdfParse from 'pdf-parse';

export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    // Fetch PDF from URL
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extract text using pdf-parse
    const data = await pdfParse(buffer);
    
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`PDF text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function cleanExtractedText(text: string): string {
  // Clean up the extracted text
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();
}

export function extractKeyValues(text: string): Array<{parameter: string, value: string, unit?: string}> {
  // Regex patterns for common lab parameters
  const patterns = [
    // HbA1c patterns
    /(?:HbA1c|Hemoglobin A1c|A1C)[\s:]*(\d+\.?\d*)\s*([%]|mmol\/mol)/gi,
    // Glucose patterns
    /(?:Glucose|Blood Glucose|Sugar)[\s:]*(\d+\.?\d*)\s*(mg\/dL|mmol\/L)/gi,
    // Cholesterol patterns
    /(?:Total Cholesterol|Cholesterol)[\s:]*(\d+\.?\d*)\s*(mg\/dL|mmol\/L)/gi,
    // HDL patterns
    /(?:HDL|HDL Cholesterol)[\s:]*(\d+\.?\d*)\s*(mg\/dL|mmol\/L)/gi,
    // LDL patterns
    /(?:LDL|LDL Cholesterol)[\s:]*(\d+\.?\d*)\s*(mg\/dL|mmol\/L)/gi,
    // Triglycerides patterns
    /(?:Triglycerides|TG)[\s:]*(\d+\.?\d*)\s*(mg\/dL|mmol\/L)/gi,
    // Blood Pressure (if mentioned in text)
    /(?:Blood Pressure|BP)[\s:]*(\d+\/\d+)\s*(mmHg)?/gi,
    // Creatinine patterns
    /(?:Creatinine|Serum Creatinine)[\s:]*(\d+\.?\d*)\s*(mg\/dL|μmol\/L)/gi,
    // Hemoglobin patterns
    /(?:Hemoglobin|Hb)[\s:]*(\d+\.?\d*)\s*(g\/dL|g\/L)/gi,
  ];

  const results: Array<{parameter: string, value: string, unit?: string}> = [];
  
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        results.push({
          parameter: match[0].split(/[\s:]/)[0], // Get the parameter name
          value: match[1],
          unit: match[2] || undefined
        });
      }
    }
  });

  return results;
}