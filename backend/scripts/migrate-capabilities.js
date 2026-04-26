/**
 * Migration: role → capability model
 * Run once: node scripts/migrate-capabilities.js
 *
 * Safe to run multiple times — skips users already migrated.
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const User = require('../models/User');
  const users = await User.find({}).lean();

  console.log(`Found ${users.length} users to process`);

  let migrated = 0;
  let skipped  = 0;

  for (const u of users) {
    // Already migrated — has explicit canRent/canList set
    const alreadyMigrated =
      u.onboardingComplete !== undefined ||
      u.type !== undefined;

    if (alreadyMigrated && u.type) {
      skipped++;
      continue;
    }

    let update = {};

    if (u.role === 'admin') {
      update = { type: 'admin', canRent: true, canList: true, onboardingComplete: true };
    } else if (u.role === 'owner') {
      // Existing owners had canList — preserve that
      update = { type: 'user', canRent: true, canList: true, onboardingComplete: true };
    } else {
      // renter default
      update = { type: 'user', canRent: true, canList: false, onboardingComplete: true };
    }

    await User.updateOne({ _id: u._id }, { $set: update });
    console.log(`  Migrated: ${u.email} (${u.role}) → type:${update.type} canList:${update.canList}`);
    migrated++;
  }

  console.log(`\n✅ Migration complete: ${migrated} migrated, ${skipped} skipped`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});