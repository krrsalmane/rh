// Test the translation service
const { 
  translateText, 
  translateTemplate, 
  formatDate, 
  formatCurrency, 
  formatNumber,
  getLanguageClasses,
  getTextDirection,
  SupportedLanguage
} = require('./src/modules/documents/translationService.ts');

// Test basic translation
console.log('🧪 Testing Translation Service...\n');

// Test French (default)
console.log('🇫🇷 French:');
console.log('  "employee" ->', translateText('employee', 'fr'));
console.log('  "company" ->', translateText('company', 'fr'));
console.log('  Date:', formatDate(new Date(), 'fr'));
console.log('  Currency:', formatCurrency(1234.56, 'fr'));

// Test Arabic
console.log('\n🇸🇦 Arabic:');
console.log('  "employee" ->', translateText('employee', 'ar'));
console.log('  "company" ->', translateText('company', 'ar'));
console.log('  Date:', formatDate(new Date(), 'ar'));
console.log('  Currency:', formatCurrency(1234.56, 'ar'));
console.log('  Direction:', getTextDirection('ar'));

// Test English
console.log('\n🇬🇧 English:');
console.log('  "employee" ->', translateText('employee', 'en'));
console.log('  "company" ->', translateText('company', 'en'));
console.log('  Date:', formatDate(new Date(), 'en'));
console.log('  Currency:', formatCurrency(1234.56, 'en'));

// Test German
console.log('\n🇩🇪 German:');
console.log('  "employee" ->', translateText('employee', 'de'));
console.log('  "company" ->', translateText('company', 'de'));
console.log('  Date:', formatDate(new Date(), 'de'));
console.log('  Currency:', formatCurrency(1234.56, 'de'));

// Test template translation
console.log('\n📄 Template Translation Test:');
const sampleTemplate = `
  <h1>Employee Contract</h1>
  <p>This is a contract for the employee.</p>
  <p>Company: {{company.name}}</p>
  <p>Employee: {{employee.fullName}}</p>
  <p>Date: {{meta.generatedAt}}</p>
`;

console.log('Original:', sampleTemplate);
console.log('French:', translateTemplate(sampleTemplate, 'fr'));
console.log('Arabic:', translateTemplate(sampleTemplate, 'ar'));
console.log('English:', translateTemplate(sampleTemplate, 'en'));
console.log('German:', translateTemplate(sampleTemplate, 'de'));

console.log('\n✅ Translation Service Test Complete');
