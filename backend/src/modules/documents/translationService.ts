// Multi-language translation service for documents
import { AppError } from '../../shared/utils/AppError';

export type SupportedLanguage = 'fr' | 'ar' | 'en' | 'de';

export interface TranslationConfig {
  language: SupportedLanguage;
  direction: 'ltr' | 'rtl';
  dateFormat: Intl.DateTimeFormatOptions;
  numberFormat: Intl.NumberFormatOptions;
  currencyFormat: Intl.NumberFormatOptions;
}

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, TranslationConfig> = {
  fr: {
    language: 'fr',
    direction: 'ltr',
    dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' },
    numberFormat: { style: 'decimal', minimumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }
  },
  ar: {
    language: 'ar',
    direction: 'rtl',
    dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' },
    numberFormat: { style: 'decimal', minimumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }
  },
  en: {
    language: 'en',
    direction: 'ltr',
    dateFormat: { day: '2-digit', month: 'long', year: 'numeric' },
    numberFormat: { style: 'decimal', minimumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }
  },
  de: {
    language: 'de',
    direction: 'ltr',
    dateFormat: { day: '2-digit', month: 'long', year: 'numeric' },
    numberFormat: { style: 'decimal', minimumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }
  }
};

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  fr: {
    'employee': 'employé',
    'employees': 'employés',
    'company': 'entreprise',
    'contract': 'contrat',
    'salary': 'salaire',
    'department': 'département',
    'hire_date': 'date d\'embauche',
    'birth_date': 'date de naissance',
    'address': 'adresse',
    'phone': 'téléphone',
    'email': 'e-mail',
    'status': 'statut',
    'position': 'poste',
    'manager': 'manager',
    'generated_at': 'généré le',
    'document': 'document',
    'certificate': 'certificat',
    'work': 'travail',
    'leave': 'congé',
    'holiday': 'vacances',
    'sick': 'maladie',
    'approval': 'approbation',
    'signature': 'signature',
    'date': 'date',
    'name': 'nom',
    'first_name': 'prénom',
    'last_name': 'nom de famille',
    'full_name': 'nom complet',
    'national_id': 'numéro de carte d\'identité nationale',
    'student_id': 'numéro d\'étudiant',
    'function': 'fonction',
    'type': 'type',
    'duration': 'durée',
    'period': 'période',
    'from': 'de',
    'to': 'à',
    'total': 'total',
    'amount': 'montant',
    'year': 'année',
    'month': 'mois',
    'day': 'jour',
    'yes': 'oui',
    'no': 'non',
    'active': 'actif',
    'inactive': 'inactif',
    'permanent': 'permanent',
    'temporary': 'temporaire',
    'full_time': 'temps plein',
    'part_time': 'temps partiel',
    'attestation': 'attestation',
    'travail': 'travail',
    // Titles
    'ATTESTATION DE TRAVAIL': 'ATTESTATION DE TRAVAIL',
    'ATTESTATION DE SALAIRE': 'ATTESTATION DE SALAIRE',
    'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE': 'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE',
    // Combined phrases
    'dont le siège social est situé au': 'dont le siège social est situé au',
    'occupe actuellement le poste de': 'occupe actuellement le poste de',
    'au sein du département': 'au sein du département',
    'je soussigné(e)': 'je soussigné(e)',
    'je soussigné': 'je soussigné',
    'dont le siège social': 'dont le siège social',
    'atteste par la présente que': 'atteste par la présente que',
    'atteste par la présente': 'atteste par la présente',
    'titulaire de la CIN n°': 'titulaire de la CIN n°',
    'de la CIN n°': 'de la CIN n°',
    'est employé(e) au sein de notre entreprise depuis le': 'est employé(e) au sein de notre entreprise depuis le',
    'est employé(e)': 'est employé(e)',
    'est employé': 'est employé',
    'Il/Elle': 'Il/Elle',
    'au sein': 'au sein',
    'de notre entreprise': 'de notre entreprise',
    'depuis le': 'depuis le',
    'occupe actuellement': 'occupe actuellement',
    'le poste': 'le poste',
    'notamment pour': 'notamment pour',
    'sous contrat': 'sous contrat',
    'la présente attestation': 'la présente attestation',
    'est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit': 'est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit',
    'est délivrée': 'est délivrée',
    'à l\'intéressé(e)': 'à l\'intéressé(e)',
    'à l\'intéressé': 'à l\'intéressé',
    'pour servir et valoir': 'pour servir et valoir',
    'ce que de droit': 'ce que de droit',
    'Signature et cachet de l\'entreprise': 'Signature et cachet de l\'entreprise',
    'et cachet': 'et cachet',
    'de l\'entreprise': 'de l\'entreprise',
    'fait à': 'fait à',
    'que': 'que',
    'le': 'le',
    'Morocco': 'Morocco'
  },
  ar: {
    'employee': 'موظف',
    'employees': 'الموظفين',
    'company': 'شركة',
    'contract': 'عقد',
    'salary': 'راتب',
    'department': 'قسم',
    'hire_date': 'تاريخ التوظيف',
    'birth_date': 'تاريخ الميلاد',
    'address': 'عنوان',
    'phone': 'هاتف',
    'email': 'بريد إلكتروني',
    'status': 'الحالة',
    'position': 'منصب',
    'manager': 'مدير',
    'generated_at': 'تم إنشاؤه في',
    'document': 'وثيقة',
    'certificate': 'شهادة',
    'work': 'عمل',
    'leave': 'إجازة',
    'holiday': 'عطلة',
    'sick': 'مرض',
    'approval': 'موافقة',
    'signature': 'توقيع',
    'date': 'تاريخ',
    'name': 'اسم',
    'first_name': 'الاسم الأول',
    'last_name': 'اسم العائلة',
    'full_name': 'الاسم الكامل',
    'national_id': 'رقم البطاقة الوطنية',
    'student_id': 'رقم البطاقة الجامعية',
    'function': 'وظيفة',
    'type': 'نوع',
    'duration': 'مدة',
    'period': 'فترة',
    'from': 'من',
    'to': 'إلى',
    'total': 'المجموع',
    'amount': 'المبلغ',
    'year': 'سنة',
    'month': 'شهر',
    'day': 'يوم',
    'yes': 'نعم',
    'no': 'لا',
    'active': 'نشط',
    'inactive': 'غير نشط',
    'permanent': 'دائم',
    'temporary': 'مؤقت',
    'full_time': 'دوام كامل',
    'part_time': 'دوام جزئي',
    'attestation': 'شهادة',
    'travail': 'عمل',
    // Titles
    'ATTESTATION DE TRAVAIL': 'شهادة عمل',
    'ATTESTATION DE SALAIRE': 'شهادة راتب',
    'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE': 'عقد عمل غير محدد المدة',
    // Combined phrases
    'dont le siège social est situé au': '، الكائن مقرها الاجتماعي بـ',
    'occupe actuellement le poste de': 'ويشغل(ت) حالياً منصب',
    'au sein du département': 'داخل قسم',
    'je soussigné(e)': 'أنا الموقع أسفله،',
    'je soussigné': 'أنا الموقع أسفله،',
    'dont le siège social': 'الكائن مقرها الاجتماعي بـ',
    'atteste par la présente que': '، أشهد بموجب هذه الشهادة أن:',
    'atteste par la présente': 'أشهد بموجب هذه الشهادة',
    'titulaire de la CIN n°': '، حامل(ة) بطاقة التعريف الوطنية رقم',
    'de la CIN n°': 'بطاقة التعريف الوطنية رقم',
    'est employé(e) au sein de notre entreprise depuis le': '، يشتغل(ت) داخل شركتنا منذ تاريخ',
    'est employé(e)': 'يشتغل(ت)',
    'est employé': 'يشتغل(ت)',
    'Il/Elle': 'هو/هي',
    'au sein': 'داخل',
    'de notre entreprise': 'شركتنا',
    'depuis le': 'منذ تاريخ',
    'occupe actuellement': 'ويشغل(ت) حالياً',
    'le poste': 'منصب',
    'notamment pour': 'وذلك لـ',
    'sous contrat': '، وذلك بموجب عقد',
    'la presente attestation': 'تُسلم هذه الشهادة',
    'la présente attestation': 'تُسلم هذه الشهادة',
    'est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit': 'للمعني(ة) بالأمر للإدلاء بها عند الحاجة.',
    'est délivrée': 'تُسلم',
    'à l\'intéressé(e)': 'للمعني(ة) بالأمر',
    'à l\'intéressé': 'للمعني(ة) بالأمر',
    'pour servir et valoir': 'للإدلاء بها عند الحاجة',
    'ce que de droit': 'عند الحاجة',
    'Signature et cachet de l\'entreprise': 'التوقيع وختم الشركة',
    'et cachet': 'وختم',
    'de l\'entreprise': 'الشركة',
    'fait à': 'حرر بـ:',
    'que': 'أن',
    'le': 'بتاريخ:',
    'Morocco': 'المغرب'
  },
  en: {
    'employee': 'employee',
    'employees': 'employees',
    'company': 'company',
    'contract': 'contract',
    'salary': 'salary',
    'department': 'department',
    'hire_date': 'hire date',
    'birth_date': 'birth date',
    'address': 'address',
    'phone': 'phone',
    'email': 'email',
    'status': 'status',
    'position': 'position',
    'manager': 'manager',
    'generated_at': 'generated on',
    'document': 'document',
    'certificate': 'certificate',
    'work': 'work',
    'leave': 'leave',
    'holiday': 'holiday',
    'sick': 'sick',
    'approval': 'approval',
    'signature': 'signature',
    'date': 'date',
    'name': 'name',
    'first_name': 'first name',
    'last_name': 'last name',
    'full_name': 'full name',
    'national_id': 'national ID',
    'student_id': 'student ID',
    'function': 'function',
    'type': 'type',
    'duration': 'duration',
    'period': 'period',
    'from': 'from',
    'to': 'to',
    'total': 'total',
    'amount': 'amount',
    'year': 'year',
    'month': 'month',
    'day': 'day',
    'yes': 'yes',
    'no': 'no',
    'active': 'active',
    'inactive': 'inactive',
    'permanent': 'permanent',
    'temporary': 'temporary',
    'full_time': 'full time',
    'part_time': 'part time',
    'attestation': 'certificate',
    'travail': 'work',
    // Titles
    'ATTESTATION DE TRAVAIL': 'Employment Certificate',
    'ATTESTATION DE SALAIRE': 'Salary Certificate',
    'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE': 'Permanent Employment Contract',
    // Combined phrases
    'dont le siège social est situé au': ', with registered office in',
    'occupe actuellement le poste de': 'He/She currently holds the position of',
    'au sein du département': 'in the',
    'je soussigné(e)': 'We,',
    'je soussigné': 'We,',
    'dont le siège social': ', with registered office in',
    'atteste par la présente que': ', hereby certify that:',
    'atteste par la présente': 'hereby certify',
    'titulaire de la CIN n°': ', holder of national ID number',
    'de la CIN n°': 'national ID number',
    'est employé(e) au sein de notre entreprise depuis le': ', has been employed in our company since',
    'est employé(e)': 'has been employed',
    'est employé': 'has been employed',
    'Il/Elle': 'He/She',
    'au sein': 'in',
    'de notre entreprise': 'our company',
    'depuis le': 'since',
    'occupe actuellement': 'currently holds the position of',
    'le poste': 'the position',
    'notamment pour': 'specifically for',
    'sous contrat': ', under a',
    'la presente attestation': 'This certificate',
    'la présente attestation': 'This certificate',
    'est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit': 'is issued to the interested party to serve as proof wherever required.',
    'est délivrée': 'is issued',
    'à l\'intéressé(e)': 'to the interested party',
    'à l\'intéressé': 'to the interested party',
    'pour servir et valoir': 'to serve as proof',
    'ce que de droit': 'wherever required',
    'Signature et cachet de l\'entreprise': 'Signature and company stamp',
    'et cachet': 'and stamp',
    'de l\'entreprise': 'of the company',
    'fait à': 'Issued in:',
    'que': 'that',
    'le': 'Date:',
    'Morocco': 'Morocco'
  },
  de: {
    'employee': 'Mitarbeiter',
    'employees': 'Mitarbeiter',
    'company': 'Unternehmen',
    'contract': 'Vertrag',
    'salary': 'Gehalt',
    'department': 'Abteilung',
    'hire_date': 'Einstellungsdatum',
    'birth_date': 'Geburtsdatum',
    'address': 'Adresse',
    'phone': 'Telefon',
    'email': 'E-Mail',
    'status': 'Status',
    'position': 'Position',
    'manager': 'Manager',
    'generated_at': 'erstellt am',
    'document': 'Dokument',
    'certificate': 'Zertifikat',
    'work': 'Arbeit',
    'leave': 'Urlaub',
    'holiday': 'Feiertag',
    'sick': 'krank',
    'approval': 'Genehmigung',
    'signature': 'Unterschrift',
    'date': 'Datum',
    'name': 'Name',
    'first_name': 'Vorname',
    'last_name': 'Nachname',
    'full_name': 'Vollständiger Name',
    'national_id': 'Personalausweis',
    'student_id': 'Studentenausweis',
    'function': 'Funktion',
    'type': 'Typ',
    'duration': 'Dauer',
    'period': 'Zeitraum',
    'from': 'von',
    'to': 'bis',
    'total': 'Gesamt',
    'amount': 'Betrag',
    'year': 'Jahr',
    'month': 'Monat',
    'day': 'Tag',
    'yes': 'Ja',
    'no': 'Nein',
    'active': 'aktiv',
    'inactive': 'inaktiv',
    'permanent': 'fest',
    'temporary': 'temporär',
    'full_time': 'Vollzeit',
    'part_time': 'Teilzeit',
    'attestation': 'Bescheinigung',
    'travail': 'Arbeit',
    // Titles
    'ATTESTATION DE TRAVAIL': 'Arbeitsbescheinigung',
    'ATTESTATION DE SALAIRE': 'Gehaltsbescheinigung',
    'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE': 'Unbefristeter Arbeitsvertrag',
    // Combined phrases
    'dont le siège social est situé au': ', mit Sitz in',
    'occupe actuellement le poste de': 'bekleidet derzeit die Position',
    'au sein du département': 'in der Abteilung',
    'je soussigné(e)': 'Wir,',
    'je soussigné': 'Wir,',
    'dont le siège social': ', mit Sitz in',
    'atteste par la présente que': ', bescheinigen hiermit, dass:',
    'atteste par la présente': 'bescheinigen hiermit',
    'titulaire de la CIN n°': ', Inhaber/in des Personalausweises Nr.',
    'de la CIN n°': 'Personalausweis-Nr.',
    'est employé(e) au sein de notre entreprise depuis le': ', ist seit dem',
    'est employé(e)': 'ist beschäftigt',
    'est employé': 'ist beschäftigt',
    'Il/Elle': 'Er/Sie',
    'au sein': 'innerhalb',
    'de notre enterprise': 'unseres Unternehmens',
    'de notre entreprise': 'unseres Unternehmens',
    'depuis le': 'seit dem',
    'occupe actuellement': 'bekleidet derzeit',
    'le poste': 'die Position',
    'notamment pour': 'insbesondere für',
    'sous contrat': ', im Rahmen einer',
    'la presente attestation': 'Diese Bescheinigung',
    'la présente attestation': 'Diese Bescheinigung',
    'est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit': 'wird der betreffenden Person zur Vorlage bei den zuständigen Stellen ausgestellt.',
    'est délivrée': 'wird ausgestellt',
    'à l\'intéressé(e)': 'an die betreffende Person',
    'à l\'intéressé': 'an die betreffende Person',
    'pour servir et valoir': 'als Nachweis',
    'ce que de droit': 'zur Vorlage bei den zuständigen Stellen',
    'Signature et cachet de l\'entreprise': 'Unterschrift und Firmenstempel',
    'et cachet': 'und Stempel',
    'de l\'entreprise': 'des Unternehmens',
    'fait à': 'Ort:',
    'que': 'dass',
    'le': 'Datum:',
    'Morocco': 'Marokko'
  }
};

/**
 * Translate text to target language
 */
export function translateText(text: string, targetLanguage: SupportedLanguage): string {
  if (targetLanguage === 'fr') {
    return text;
  }

  const translations = TRANSLATIONS[targetLanguage];
  let translated = text;

  // Sort longest phrase first so multi-word phrases match before sub-phrases
  const sortedTranslations = Object.entries(translations).sort((a, b) => b[0].length - a[0].length);

  for (const [frenchTerm, translatedTerm] of sortedTranslations) {
    // Escape regex special chars in the phrase
    const escaped = frenchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use Unicode-aware lookahead/lookbehind instead of \b
    // Boundary: not preceded or followed by a letter (including accented)
    const regex = new RegExp(`(?<![\\wÀ-ÿ])${escaped}(?![\\wÀ-ÿ])`, 'gi');
    translated = translated.replace(regex, translatedTerm);
  }

  // Post-processing for German word order if needed
  if (targetLanguage === 'de') {
    // Hack to fix "seit dem [Date] ... beschäftigt ist"
    // The French template has: "... depuis le {{hireDate}}."
    // If our translation for "depuis le" was "ist seit dem", it becomes "ist seit dem {{hireDate}}."
    // We want "seit dem {{hireDate}} ... beschäftigt ist."
    // This is hard to do globally without knowing the full template context.
    // However, we can try to fix the common patterns.
  }

  return translated;
}

/**
 * Translate template content, carefully skipping all Handlebars {{...}} expressions.
 * Only plain-text segments between expressions are translated.
 */
export function translateTemplate(template: string, targetLanguage: SupportedLanguage): string {
  if (targetLanguage === 'fr') return template;

  console.log(`🔧 translateTemplate called with language: ${targetLanguage}`);
  console.log(`📄 Original template length: ${template.length}`);

  // Split on Handlebars tokens — odd-indexed parts are {{...}} blocks, skip them
  const HANDLEBARS_RE = /({{[\s\S]*?}})/g;
  const parts = template.split(HANDLEBARS_RE);
  let translationCount = 0;

  const result = parts.map((part, index) => {
    // Odd indices are {{...}} tokens — leave untouched
    if (index % 2 === 1) return part;

    const translated = translateText(part, targetLanguage);
    if (translated !== part) {
      translationCount++;
      console.log(`🔄 Translated segment #${index}: "${part.trim().substring(0, 60)}"`);
    }
    return translated;
  });

  console.log(`✅ Template translation complete. ${translationCount} segments changed.`);
  return result.join('');
}

/**
 * Format date according to language
 */
export function formatDate(date: Date | string, language: SupportedLanguage): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const config = LANGUAGE_CONFIGS[language];
  return dateObj.toLocaleDateString(config.language, config.dateFormat);
}

/**
 * Format currency according to language
 */
export function formatCurrency(amount: number, language: SupportedLanguage): string {
  const config = LANGUAGE_CONFIGS[language];
  return amount.toLocaleString(config.language, config.currencyFormat);
}

/**
 * Format number according to language
 */
export function formatNumber(amount: number, language: SupportedLanguage): string {
  const config = LANGUAGE_CONFIGS[language];
  return amount.toLocaleString(config.language, config.numberFormat);
}

/**
 * Get language-specific CSS classes
 */
export function getLanguageClasses(language: SupportedLanguage): string {
  const config = LANGUAGE_CONFIGS[language];
  return `lang-${language} dir-${config.direction}`;
}

/**
 * Get language-specific font family
 */
export function getLanguageFont(language: SupportedLanguage): string {
  switch (language) {
    case 'ar':
      return 'Arial, "Segoe UI", "Tahoma", sans-serif';
    case 'de':
    case 'en':
      return 'Arial, "Helvetica Neue", Helvetica, sans-serif';
    case 'fr':
    default:
      return 'Arial, "Helvetica Neue", Helvetica, sans-serif';
  }
}

/**
 * Get language-specific text direction
 */
export function getTextDirection(language: SupportedLanguage): 'ltr' | 'rtl' {
  return LANGUAGE_CONFIGS[language].direction;
}

/**
 * Validate if language is supported
 */
export function isValidLanguage(language: string): language is SupportedLanguage {
  return ['fr', 'ar', 'en', 'de'].includes(language);
}

/**
 * Get default language (French)
 */
export function getDefaultLanguage(): SupportedLanguage {
  return 'fr';
}