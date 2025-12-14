import hindiTranslations from './hindi.json';
import marathiTranslations from './marathi.json';

export type TranslationLanguage = 'hindi' | 'marathi' | null;

export const translations = {
  hindi: hindiTranslations,
  marathi: marathiTranslations,
};

export const getFrequencyTranslation = (frequency: string, language: TranslationLanguage): string => {
  if (!language || !frequency) return frequency;
  
  const translation = translations[language]?.frequency?.[frequency];
  return translation || frequency;
};

export const getMedicineTimeTranslation = (medicineTime: string, language: TranslationLanguage): string => {
  if (!language || !medicineTime) return medicineTime;
  
  const translation = translations[language]?.medicineTime?.[medicineTime];
  return translation || medicineTime;
};

export const getLabelTranslation = (label: string, language: TranslationLanguage): string => {
  if (!language || !label) return label;
  
  const translation = translations[language]?.labels?.[label];
  return translation || label;
};

/**
 * Expands frequency pattern like "1-0-0" to readable format
 * 1-0-0 = Breakfast only
 * 0-1-0 = Lunch only
 * 0-0-1 = Dinner only
 * 1-1-0 = Breakfast & Lunch
 * 1-0-1 = Breakfast & Dinner
 * 0-1-1 = Lunch & Dinner
 * 1-1-1 = All meals
 * 0-0-0 = As needed
 */
export const expandFrequencyPattern = (frequency: string): string => {
  const patterns: Record<string, string> = {
    '1-0-0': 'Breakfast only',
    '0-1-0': 'Lunch only',
    '0-0-1': 'Dinner only',
    '1-1-0': 'Breakfast & Lunch',
    '1-0-1': 'Breakfast & Dinner',
    '0-1-1': 'Lunch & Dinner',
    '1-1-1': 'All meals',
    '0-0-0': 'As needed',
  };
  
  return patterns[frequency] || frequency;
};

/**
 * Gets translated frequency with expansion
 */
export const getTranslatedFrequency = (frequency: string, language: TranslationLanguage): { english: string; translated: string } => {
  const expanded = expandFrequencyPattern(frequency);
  const translated = getFrequencyTranslation(frequency, language);
  
  // If translation exists and is different from original, use it
  // Otherwise use expanded English version
  const finalTranslated = (language && translated !== frequency) ? translated : expanded;
  
  return {
    english: expanded !== frequency ? expanded : frequency,
    translated: finalTranslated,
  };
};
