const { compileTemplate } = require('./src/modules/documents/templateEngine');
const { loadTemplate } = require('./src/modules/documents/templateLoader');

Write-Host "Testing static template system..."

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

  $frResult = compileTemplate('attestation_travail', $testData, 'fr')
  Write-Host "French result length: $($frResult.html.length)"
  Write-Host "French sample: $($frResult.html.Substring(0, 200))..."

  $arResult = compileTemplate('attestation_travail', $testData, 'ar')
  Write-Host "Arabic result length: $($arResult.html.length)"
  Write-Host "Arabic sample: $($arResult.html.Substring(0, 200))..."

  $enResult = compileTemplate('attestation_travail', $testData, 'en')
  Write-Host "English result length: $($enResult.html.length)"
  Write-Host "English sample: $($enResult.html.Substring(0, 200))..."

  $deResult = compileTemplate('attestation_travail', $testData, 'de')
  Write-Host "German result length: $($deResult.html.length)"
  Write-Host "German sample: $($deResult.html.Substring(0, 200))..."

  $frenchInArabic = $arResult.html -like "*Je soussigné*" -or $arResult.html -like "*employé*"
  $frenchInEnglish = $enResult.html -like "*Je soussigné*" -or $enResult.html -like "*employé*"
  $frenchInGerman = $deResult.html -like "*Je soussigné*" -or $deResult.html -like "*employé*"

  Write-Host "Mixed language detection:"
  Write-Host "  French words in Arabic: $(if ($frenchInArabic) {'YES'} else {'NO'})"
  Write-Host "  French words in English: $(if ($frenchInEnglish) {'YES'} else {'NO'})"
  Write-Host "  French words in German: $(if ($frenchInGerman) {'YES'} else {'NO'})"

  if (-not $frenchInArabic -and -not $frenchInEnglish -and -not $frenchInGerman) {
    Write-Host "SUCCESS: Static template system working correctly!"
    Write-Host "  All templates are 100% in their target languages."
  } else {
    Write-Host "FAILURE: Mixed language detected in templates!"
    exit 1
  }

} catch {
  Write-Host "Test failed: $_"
  exit 1
}
