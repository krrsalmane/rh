const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndRemoveSignatures() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Checking templates for signature sections...\n');

    // Get all templates
    const [templates] = await connection.execute('SELECT id, name, body FROM templates');

    console.log(`Found ${templates.length} templates\n`);

    for (const template of templates) {
      const body = template.body;
      const hasFooterSignature = body.includes('Signature de l\'employeur') || body.includes('Signature du salarié');
      
      if (hasFooterSignature) {
        console.log(`📄 Template: ${template.name} (ID: ${template.id})`);
        console.log(`   ⚠️  Contains signature text in footer/body`);
        console.log(`   📝 Body preview:`, body.substring(0, 500));
        
        // Remove signature sections from footer
        let updatedBody = body;
        
        // Remove signature text from FOOTER_START/FOOTER_END sections
        updatedBody = updatedBody.replace(
          /<!-- FOOTER_START -->[\s\S]*?<!-- FOOTER_END -->/g,
          '<!-- FOOTER_START -->\n{{company.name}} — {{company.address}}\n<!-- FOOTER_END -->'
        );
        
        // Remove signature text from BODY_START/BODY_END sections
        updatedBody = updatedBody.replace(
          /<!-- BODY_START -->([\s\S]*?)<!-- BODY_END -->/g,
          (match, bodyContent) => {
            // Remove signature lines from body
            const cleanedBody = bodyContent
              .replace(/<p[^>]*>\s*Signature de l'employeur\s*[:：]?[\s\S]*?<\/p>/gi, '')
              .replace(/<p[^>]*>\s*Signature du salarié\s*[:：]?[\s\S]*?<\/p>/gi, '')
              .replace(/Signature de l'employeur\s*[:：]?[\s\S]*?(_+|<hr[^>]*>)/gi, '')
              .replace(/Signature du salarié\s*[:：]?[\s\S]*?(_+|<hr[^>]*>)/gi, '')
              .replace(/<div[^>]*>\s*Signature[^<]*<\/div>/gi, '')
              .replace(/<p[^>]*>\s*Signature[^<]*<\/p>/gi, '');
            return `<!-- BODY_START -->\n${cleanedBody}\n<!-- BODY_END -->`;
          }
        );
        
        // Also remove standalone signature text if not in tags (more comprehensive)
        updatedBody = updatedBody.replace(/Signature de l'employeur\s*[:：]?\s*[_\s]+/gi, '');
        updatedBody = updatedBody.replace(/Signature du salarié\s*[:：]?\s*[_\s]+/gi, '');
        updatedBody = updatedBody.replace(/<p>\s*Signature[^<]*<\/p>/gi, '');
        updatedBody = updatedBody.replace(/<div[^>]*>\s*Signature[^<]*<\/div>/gi, '');
        
        // Remove any remaining signature-related content
        updatedBody = updatedBody.replace(/<!-- SIGNATURE_START -->[\s\S]*?<!-- SIGNATURE_END -->/g, '');
        
        if (updatedBody !== body) {
          console.log(`   ✅ Updating template...`);
          await connection.execute(
            'UPDATE templates SET body = ? WHERE id = ?',
            [updatedBody, template.id]
          );
          console.log(`   ✅ Template updated successfully\n`);
        } else {
          console.log(`   ℹ️  No changes needed\n`);
        }
      } else {
        console.log(`✓ Template: ${template.name} (ID: ${template.id}) - No signatures found\n`);
      }
    }

    console.log('✅ Done checking all templates');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

checkAndRemoveSignatures();
