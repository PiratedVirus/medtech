async function seedLlmPlaygroundProfile(prisma) {
  const existing = await prisma.llmPlaygroundProfile.findFirst({ where: { name: 'Default Medical Lab Analysis' } });
  if (existing) return existing;
  const profile = await prisma.llmPlaygroundProfile.create({ data: {
    name: 'Default Medical Lab Analysis',
    description: 'Mirrors current production prompts and parameters',
    provider: 'groq',
    model: process.env.GROQ_VALUES_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.1,
    topP: 1,
    maxTokens: 2500,
    systemPrompt: 'You are a strict JSON generator. Always respond with a single valid JSON object matching the requested schema. Do not include any prose, code fences, or explanations.',
    valuesPrompt: `Return STRICT JSON ONLY with this schema (no extra keys):\n{\n  "allValues": [\n    {"parameter": "", "value": "", "unit": "", "normalRange": "", "isAbnormal": false, "severity": "LOW|NORMAL|HIGH|CRITICAL", "category": "CBC|LFT|KFT|Lipid Profile|Glucose|Thyroid|Kidney|Liver|Electrolytes|Other"}\n  ],\n  "criticalValues": [\n    {"parameter": "", "value": "", "unit": "", "normalRange": "", "isAbnormal": true, "severity": "LOW|NORMAL|HIGH|CRITICAL", "category": "CBC|LFT|KFT|Lipid Profile|Glucose|Thyroid|Kidney|Liver|Electrolytes|Other"}\n  ]\n}\nRules: Include every discernible parameter in allValues. criticalValues must be the subset with abnormal/clinically concerning values. Use double quotes only, no trailing commas, no code fences. If a section has no data, return an empty array.\n\nLab Report Text:\n{{TEXT}}`,
    summaryPrompt: `Return STRICT JSON ONLY with this schema (no extra keys):\n{\n  "summary": "200-250 word clinical summary emphasizing significant abnormalities and their implications",\n  "keyFindings": ["short bullet of critical and notable findings (max 8)"],\n  "recommendations": ["short actionable next-step suggestions (max 8)"],\n  "urgency": "ROUTINE|SOON|URGENT"\n}\nRules: Use precise medical language, avoid hallucinations, do not include code fences, comments, or trailing commas. Double quotes everywhere.\n\nLab Report Text:\n{{TEXT}}`,
    isActive: true,
    isProductionCandidate: true,
  }});
  // Set as active only if no active profile is configured yet
  const existingConfig = await prisma.llmProductionConfig.findUnique({ where: { id: 1 } });
  if (!existingConfig || existingConfig.activeProfileId == null) {
    await prisma.llmProductionConfig.upsert({ where: { id: 1 }, update: { activeProfileId: profile.id }, create: { id: 1, activeProfileId: profile.id } });
  }
  return profile;
}

module.exports = { seedLlmPlaygroundProfile };


