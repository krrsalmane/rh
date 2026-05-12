// Test the template compilation fix
const Handlebars = require('handlebars');

// Mock the translation functions
const TRANSLATIONS = {
  fr: { 'employee': 'employé', 'company': 'entreprise' },
  ar: { 'employee': 'موظف', 'company': 'شركة' },
  en: { 'employee': 'employee', 'company': 'company' },
  de: { 'employee': 'Mitarbeiter', 'company': 'Unternehmen' }
};

function translateTemplate(template, language) {
  let translated = template;
  const translations = TRANSLATIONS[language];
  
  for (const [englishTerm, translatedTerm] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
    translated = translated.replace(regex, translatedTerm);
  }
  
  return translated;
}

// Register helpers with language support (fixed version)
Handlebars.registerHelper('formatDate', (dateStr, options) => {
  if (!dateStr) return '—';
  try {
    // Get language from data context
    const language = (options?.data?.root?.language || 'fr');
    console.log(`formatDate called with language: ${language}`);
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
});

// Test template compilation
function testTemplateCompilation() {
  console.log('🧪 Testing Template Compilation Fix...\n');
  
  const template = `
    <h1>Employee Contract</h1>
    <p>This is a contract for the employee.</p>
    <p>Company: {{company.name}}</p>
    <p>Date: {{formatDate meta.generatedAt}}</p>
  `;
  
  const data = {
    company: { name: 'Test Company' },
    meta: { generatedAt: '2025-05-12' },
    language: 'fr',
    direction: 'ltr'
  };
  
  try {
    // Step 1: Translate template
    const translatedTemplate = translateTemplate(template, 'fr');
    console.log('Translated template:', translatedTemplate.trim());
    
    // Step 2: Compile with Handlebars
    const compiledTemplate = Handlebars.compile(translatedTemplate);
    const result = compiledTemplate(data);
    
    console.log('\n✅ Template compilation successful!');
    console.log('Result:', result.trim());
    
    // Test with different languages
    console.log('\n🌍 Testing different languages:');
    
    const languages = ['fr', 'ar', 'en', 'de'];
    languages.forEach(lang => {
      const translated = translateTemplate(template, lang);
      const compiled = Handlebars.compile(translated);
      const result = compiled({ ...data, language: lang });
      console.log(`${lang.toUpperCase()}:`, result.split('\n')[1]); // Show first line
    });
    
  } catch (error) {
    console.error('❌ Template compilation failed:', error.message);
  }
}

testTemplateCompilation();
