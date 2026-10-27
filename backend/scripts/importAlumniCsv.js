#!/usr/bin/env node
/**
 * importAlumniCsv.js
 *
 * Command-line tool to import alumni data from the three CSV files:
 *   - alumni_2015_2016.csv
 *   - alumni_2016_2017.csv
 *   - alumni_2017_2018.csv
 * into MongoDB database `db_alumini_years`.
 *
 * Usage:
 *   node scripts/importAlumniCsv.js
 *   npm run import:csv
 */

const net = require('net');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
require('../config/env');
const connectDB = require('../config/db');
const { importCsvAlumni } = require('../services/importCsvService');
const { import2022Alumni } = require('../services/import2022Service');

function isPortOpen(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(timeout);
    s.on('connect', () => { s.destroy(); resolve(true); });
    s.on('timeout', () => { s.destroy(); resolve(false); });
    s.on('error', () => { s.destroy(); resolve(false); });
    s.connect(port, host);
  });
}

(async () => {
  console.log('='.repeat(70));
  console.log('   Alumni Connect — CSV Alumni Data Migration & Synchronization   ');
  console.log('='.repeat(70));

  let mongod = null;
  const is27017 = await isPortOpen(27017);
  const is27018 = await isPortOpen(27018);

  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/db_alumini_years';

  if (!is27017 && !is27018) {
    console.log('[import] No active MongoDB on 27017/27018. Initializing embedded MongoDB...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.resolve(__dirname, '../.mongo-data');
    mongod = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger', port: 27018 },
    });
    uri = `${mongod.getUri()}db_alumini_years`;
  } else if (!is27017 && is27018) {
    uri = 'mongodb://127.0.0.1:27018/db_alumini_years';
  }

  console.log(`[import] Connecting to MongoDB: ${uri}`);
  await connectDB(uri);

  // First ensure 2022 dataset is synced
  console.log('\n--- Step 1: Synchronizing 2022 Alumni Dataset ---');
  const res2022 = await import2022Alumni();
  console.log(`2022 Dataset: ${res2022.total} total, ${res2022.inserted} inserted, ${res2022.updated} updated, ${res2022.duplicates} existing/unchanged.`);

  // Then synchronize the 3 CSV files
  console.log('\n--- Step 2: Importing 2015-2018 CSV Files ---');
  const report = await importCsvAlumni({ silent: false });

  console.log('\n' + '='.repeat(70));
  console.log('                    CSV IMPORT SUMMARY REPORT                      ');
  console.log('='.repeat(70));
  console.log(`Files Processed       : ${report.filesProcessed.join(', ')}`);
  console.log(`Total Records Read    : ${report.totalRecordsRead}`);
  console.log(`Successfully Inserted : ${report.inserted}`);
  console.log(`Updated Records       : ${report.updated}`);
  console.log(`Duplicates / Skipped  : ${report.duplicates}`);
  console.log(`Rejected / Invalid    : ${report.rejected}`);
  console.log('-'.repeat(70));
  console.log('Data Quality & Privacy Metrics:');
  console.log(`  - Missing Email     : ${report.qualityMetrics.missingEmail} (safely preserved without fake logins)`);
  console.log(`  - Missing Company   : ${report.qualityMetrics.missingCompany} (marked 'Company Not Specified')`);
  console.log(`  - Missing Role      : ${report.qualityMetrics.missingDesignation} (marked 'Role Not Specified')`);
  console.log(`  - Missing Location  : ${report.qualityMetrics.missingLocation}`);
  console.log(`  - Valid LinkedIn URL: ${report.qualityMetrics.validLinkedIn}`);
  console.log(`  - Non-URL LinkedIn  : ${report.qualityMetrics.nonUrlLinkedInHandled} (safely omitted as URL)`);
  console.log('-'.repeat(70));
  console.log('Batch Breakdown:');
  for (const [batchFile, stats] of Object.entries(report.batches)) {
    console.log(`  * ${batchFile.padEnd(24)}: ${stats.read} read | ${stats.inserted} new | ${stats.updated} upd | ${stats.duplicates} existing`);
  }
  console.log('='.repeat(70));
  console.log('✓ Migration completed successfully. Data synchronized with database.\n');

  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  process.exit(0);
})().catch((err) => {
  console.error('\n[import] Fatal error during CSV migration:', err);
  process.exit(1);
});
