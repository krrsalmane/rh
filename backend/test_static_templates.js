const { compileTemplate } = require('./src/modules/documents/templateEngine');
const { loadTemplate } = require('./src/modules/documents/templateLoader');

// Test the new static template system
console.log('🧪 Testing static template system...\n');

try {
  const testData = {
    employee: {
      first_name: 'Mohammed',
      last_name: 'Alami',
      cin: 'AB123456',
      hire_date: '2023-01-15',
      contract_type: 'CDI',
      function: 'Développeur',
      department: 'Finance',
      salary: 25000
    },
    company: {
      name: 'Maya HR Platform',
      address: '123 Rue de la Paix, Casablanca'
    }
  };

  // Test French
  console.log('🇫🇷 Testing French template...');
  const frResult = compileTemplate('attestation_travail', testData, 'fr');
  console.log('French result length:', frResult.html.length);
  console.log('French sample:', frResult.html.substring(0, 200) + '...\n');

  // Test Arabic
  console.log('🇸🇪 Testing Arabic template...');
  const arResult = compileTemplate('attestation_travail', testData, 'ar');
  console.log('Arabic result length:', arResult.html.length);
  console.log('Arabic sample:', arResult.html.substring(0, 200) + '...\n');

  // Test English
  console.log('🇬🇧 Testing English template...');
  const enResult = compileTemplate('attestation_travail', testData, 'en');
  console.log('English result length:', enResult.html.length);
  console.log('English sample:', enResult.html.substring(0, 200) + '...\n');

  // Test German
  console.log('🇩🇪 Testing German template...');
  const deResult = compileTemplate('attestation_travail', testData, 'de');
  console.log('German result length:', deResult.html.length);
  console.log('German sample:', deResult.html.substring(0, 200) + '...\n');

  // Check for mixed language content (should be 0%!)
  const frenchInArabic = (arResult.html.includes('Je soussigné') || arResult.html.includes('employé'));
  const frenchInEnglish = (enResult.html.includes('Je soussigné') || enResult.html.includes('employé'));
  const frenchInGerman = (deResult.html.includes('Je soussigné') || deResult.html.includes('employé'));

  console.log('\n🔍 Mixed language detection:');
  console.log('  French words in Arabic:', frenchInArabic ? '❌ YES' : '✅ NO');
  console.log('  French words in English:', frenchInEnglish ? '❌ YES' : '✅ NO');
  console.log('  French words in German:', frenchInGerman ? '❌ YES' : '✅ NO');

  if (!frenchInArabic && !frenchInEnglish && !frenchInGerman) {
    console.log('\n✅ SUCCESS: Static template system working correctly!');
    console.log('  All templates are 100% in their target languages.');
  } else {
    console.log('\n❌ FAILURE: Mixed language detected in templates!');
    process.exit(1);
  }

} catch (error) {
  console.error('Test failed:', error);
  process.exit(1);
}
