const mongoose = require('mongoose');
require('../config/env');
const connectDB = require('../config/db');

async function verifyCounts() {
  await connectDB();
  const db = mongoose.connection.db;

  const totalProfiles = await db.collection('alumniprofiles').countDocuments();
  const totalAluminiRaw = await db.collection('alumini').countDocuments();
  const totalUsers = await db.collection('users').countDocuments();

  console.log(`Total AlumniProfile docs: ${totalProfiles}`);
  console.log(`Total raw alumini docs: ${totalAluminiRaw}`);
  console.log(`Total User docs: ${totalUsers}`);

  // Breakdown by graduationYear in AlumniProfile
  const yearBreakdown = await db.collection('alumniprofiles').aggregate([
    { $group: { _id: '$graduationYear', count: { $sum: 1 }, batches: { $addToSet: '$batch' } } },
    { $sort: { _id: 1 } },
  ]).toArray();

  console.log('\nAlumniProfile Breakdown by Graduation Year:');
  yearBreakdown.forEach(y => {
    console.log(`  Year ${y._id}: ${y.count} profiles (batches: ${y.batches.join(', ')})`);
  });

  // Verify that imported CSV profiles have user: null or undefined
  const nullUserCount = await db.collection('alumniprofiles').countDocuments({
    $or: [{ user: null }, { user: { $exists: false } }]
  });
  console.log(`\nImported profiles without login accounts (user is null/missing): ${nullUserCount}`);

  // Check sample records from each batch
  for (const year of [2016, 2017, 2018, 2022]) {
    const sample = await db.collection('alumniprofiles').findOne({ graduationYear: year });
    console.log(`\nSample for Year ${year}:`);
    console.log(`  Name: ${sample?.fullName}`);
    console.log(`  Company: ${sample?.currentCompany}`);
    console.log(`  Role: ${sample?.currentJobTitle}`);
    console.log(`  Batch: ${sample?.batch}`);
    console.log(`  Location: ${sample?.location || 'N/A'}`);
    console.log(`  LinkedIn URL: ${sample?.linkedinUrl || 'N/A'}`);
    console.log(`  User: ${sample?.user || 'None (no password/account)'}`);
  }

  await mongoose.disconnect();
}

verifyCounts().catch(console.error);
