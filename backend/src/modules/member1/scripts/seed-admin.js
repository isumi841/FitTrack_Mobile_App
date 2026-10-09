const path = require('node:path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const Admin = require('../models/Admin');
const BCRYPT_ROUNDS = 12;

async function seedAdmin(emailParam, passwordParam) {
  const email = (emailParam || process.env.ADMIN_EMAIL || 'admin@fittrack.com').trim().toLowerCase();
  const password = passwordParam || process.env.ADMIN_PASS || 'FitTrackAdmin2026!';

  if (!email || !password) {
    console.error('Admin email and password are required for seeding.');
    return;
  }

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin account already exists for ${email}`);
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const admin = await Admin.create({
    email,
    passwordHash,
    role: 'admin',
    displayName: 'System Administrator',
  });

  console.log(`Admin account successfully seeded for ${email} with role: admin`);
  return admin;
}

if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  mongoose.connect(mongoUri)
    .then(async () => {
      await seedAdmin();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error seeding admin:', err.message);
      process.exit(1);
    });
}

module.exports = { seedAdmin };
