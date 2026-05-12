// Test improved translation pattern with actual attestation
const TRANSLATIONS = {
  fr: {
    'attestation': 'attestation',
    'travail': 'travail',
    'je soussigné': 'je soussigné',
    'dont le siège social': 'dont le siège social',
    'situé': 'situé',
    'atteste par la présente': 'atteste par la présente',
    'que': 'que',
    'titulaire': 'titulaire',
    'est employé': 'est employé',
    'au sein': 'au sein',
    'de notre entreprise': 'de notre entreprise',
    'depuis le': 'depuis le',
    'occupe actuellement': 'occupe actuellement',
    'le poste': 'le poste',
    'sous contrat': 'sous contrat',
    'la présente attestation': 'la présente attestation',
    'est délivrée': 'est délivrée',
    'à l\'intéressé': 'à l\'intéressé',
    'pour servir et valoir': 'pour servir et valoir',
    'ce que de droit': 'ce que de droit',
    'et cachet': 'et cachet',
    'de l\'entreprise': 'de l\'entreprise',
    'fait à': 'fait à',
    'le': 'le'
  },
  ar: {
    'attestation': 'شهادة',
    'travail': 'عمل',
    'je soussigné': 'أنا الموقع أدناه',
    'dont le siège social': 'يقع مقرها الاجتماعي',
    'situé': 'يقع',
    'atteste par la présente': 'أشهد بهذه الشهادة',
    'que': 'أن',
    'titulaire': 'حامل',
    'est employé': 'يعمل',
    'au sein': 'ضمن',
    'de notre entreprise': 'شركتنا',
    'depuis le': 'منذ',
    'occupe actuellement': 'يشغل حالياً',
    'le poste': 'منصب',
    'sous contrat': 'بموجب عقد',
    'la présente attestation': 'هذه الشهادة',
    'est délivrée': 'تم إصدارها',
    'à l\'intéressé': 'للشخص المعني',
    'pour servir et valoir': 'لأغراض',
    'ce que de droit': 'القانونية',
    'et cachet': 'والختم',
    'de l\'entreprise': 'الشركة',
    'fait à': 'حررت في',
    'le': 'في'
  },
  en: {
    'attestation': 'certificate',
    'travail': 'work',
    'je soussigné': 'I, the undersigned',
    'dont le siège social': 'whose head office is located',
    'situé': 'located',
    'atteste par la présente': 'hereby certifies',
    'que': 'that',
    'titulaire': 'holder',
    'est employé': 'is employed',
    'au sein': 'within',
    'de notre entreprise': 'our company',
    'depuis le': 'since',
    'occupe actuellement': 'currently occupies',
    'le poste': 'the position',
    'sous contrat': 'under contract',
    'la présente attestation': 'this certificate',
    'est délivrée': 'is issued',
    'à l\'intéressé': 'to the interested party',
    'pour servir et valoir': 'to serve and',
    'ce que de droit': 'prove what is right',
    'et cachet': 'and stamp',
    'de l\'entreprise': 'of the company',
    'fait à': 'made at',
    'le': 'on'
  },
  de: {
    'attestation': 'Arbeitsbescheinigung',
    'travail': 'Arbeit',
    'je soussigné': 'Ich, der Unterzeichnende',
    'dont le siège social': 'dessen Sitz sich befindet',
    'situé': 'gelegen',
    'atteste par la présente': 'bescheinigt hiermit',
    'que': 'dass',
    'titulaire': 'Inhaber',
    'est employé': 'ist beschäftigt',
    'au sein': 'innerhalb',
    'de notre entreprise': 'unseres Unternehmens',
    'depuis le': 'seit',
    'occupe actuellement': 'nimmt derzeit die Position ein',
    'le poste': 'die Position',
    'sous contrat': 'unter Vertrag',
    'la présente attestation': 'diese Bescheinigung',
    'est délivrée': 'wird ausgestellt',
    'à l\'intéressé': 'an die interessierte Person',
    'pour servir et valoir': 'zu dienen und',
    'ce que de droit': 'rechtlich zu beweisen',
    'et cachet': 'und Stempel',
    'de l\'entreprise': 'des Unternehmens',
    'fait à': 'ausgestellt',
    'le': 'am'
  }
};

function translateText(text, targetLanguage) {
  const translations = TRANSLATIONS[targetLanguage];
  
  // Handle French (no translation needed for French)
  if (targetLanguage === 'fr') {
    return text;
  }
  
  let translated = text;
  
  // Sort translations by length (longest first) to handle phrases before words
  const sortedTranslations = Object.entries(translations).sort((a, b) => b[0].length - a[0].length);
  
  // Apply translations for longer phrases first
  for (const [frenchTerm, translatedTerm] of sortedTranslations) {
    // Create regex for case-insensitive matching with word boundaries
    const regex = new RegExp(`\\b${frenchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    translated = translated.replace(regex, translatedTerm);
  }
  
  return translated;
}

function translateTemplate(template, targetLanguage) {
  console.log(`🔧 translateTemplate called with language: ${targetLanguage}`);
  console.log(`📄 Original template length: ${template.length}`);
  
  // More comprehensive pattern to catch all text including phrases
  const textPattern = /([^{{]*[a-zA-Zéèêàçùâäöüß\s]+[^}}]*)/g;
  let translated = template;
  let match;
  let translationCount = 0;
  
  while ((match = textPattern.exec(template)) !== null) {
    const textSegment = match[1].trim();
    // Try to translate this segment
    const translatedSegment = translateText(textSegment, targetLanguage);
    if (translatedSegment !== textSegment) {
      translated = translated.replace(match[0], translatedSegment);
      translationCount++;
      console.log(`🔄 Translated: "${textSegment}" -> "${translatedSegment}"`);
    }
  }
  
  console.log(`✅ Template translation complete. ${translationCount} terms translated.`);
  return translated;
}

function testImprovedTranslation() {
  console.log('🧪 Testing Improved Translation Pattern...\n');
  
  const attestationText = `ATTESTATION DE TRAVAIL
Je soussigné(e), Maya HR Company, dont le siège social est situé au Casablanca, Morocco, atteste par la présente que
Salmane Finance, titulaire de la CIN n° CIN-61647, est employé(e) au sein de notre entreprise depuis le
Sun Dec 31 2023 00:00:00 GMT+0100 (GMT+01:00).
Il/Elle occupe actuellement le poste de Accountant au sein du département Finance, sous contrat CDI
La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit
Signature et cachet de l'entreprise
2026/05/Fait à ____________, le 12`;
  
  console.log('📄 Original French Text:');
  console.log(attestationText);
  
  const languages = ['fr', 'ar', 'en', 'de'];
  
  languages.forEach(lang => {
    console.log(`\n🌍 ${lang.toUpperCase()} Translation:`);
    const translated = translateTemplate(attestationText, lang);
    console.log(translated.substring(0, 500) + '...');
  });
  
  console.log('\n✅ Improved translation test complete!');
}

testImprovedTranslation();
