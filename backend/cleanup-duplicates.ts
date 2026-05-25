import { query } from './src/config/database';

async function cleanupDuplicates() {
  try {
    console.log('\n🔍 Scanning for duplicate employees...\n');

    // Find duplicate emails
    const duplicates = await query(
      `SELECT email, COUNT(*) as count FROM employees 
       WHERE email IS NOT NULL 
       GROUP BY email, company_id 
       HAVING COUNT(*) > 1`
    );

    if (duplicates.rows.length === 0) {
      console.log('✅ No duplicate emails found');
      process.exit(0);
      return;
    }

    console.log(`⚠️  Found ${duplicates.rows.length} email addresses with duplicates\n`);

    // For each duplicate email, keep only the oldest record and delete the rest
    let totalDeleted = 0;
    for (const dup of duplicates.rows) {
      const records = await query(
        `SELECT id, created_at FROM employees 
         WHERE email = $1 
         ORDER BY created_at ASC`,
        [dup.email]
      );

      if (records.rows.length > 1) {
        const keepId = records.rows[0].id; // Keep the oldest
        const deleteIds = records.rows.slice(1).map(r => r.id);

        console.log(`📧 ${dup.email}`);
        console.log(`   Keeping: ${keepId} (created: ${records.rows[0].created_at})`);
        console.log(`   Deleting ${deleteIds.length} duplicate(s):`);

        for (const id of deleteIds) {
          await query('DELETE FROM employees WHERE id = $1', [id]);
          console.log(`   ✓ Deleted ${id}`);
          totalDeleted++;
        }
        console.log('');
      }
    }

    // Final count
    const finalCount = await query(
      'SELECT COUNT(DISTINCT email) as unique_employees FROM employees WHERE email IS NOT NULL'
    );

    console.log(`\n✅ Cleanup Complete!`);
    console.log(`   Deleted ${totalDeleted} duplicate records`);
    console.log(`   Unique employees remaining: ${finalCount.rows[0].unique_employees}\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
