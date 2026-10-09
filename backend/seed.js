require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');
const User = require('./models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@fittrack.com';
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 12);

    // Delete any existing admin with this email just in case
    await Admin.deleteOne({ email });
    // Delete any existing user with this email just in case
    await User.deleteOne({ email });

    await Admin.create({
      email,
      passwordHash,
      displayName: 'System Admin',
      role: 'admin'
    });
    console.log('Admin user created successfully');

    await User.create([
      { email: 'nimal@example.com', passwordHash, displayName: 'Nimal Perera', isEmailVerified: true, role: 'user' },
      { email: 'kamal@example.com', passwordHash, displayName: 'Kamal Silva', isEmailVerified: true, role: 'user' },
      { email: 'sunil@example.com', passwordHash, displayName: 'Sunil Fernando', isEmailVerified: false, role: 'user' }
    ]);
    console.log('Fake users created successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
