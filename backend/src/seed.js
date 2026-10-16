import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Task from './models/Task.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedData = async () => {
  try {
    if (!process.env.SEED_EMAIL || !process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 8) {
      throw new Error('Set SEED_EMAIL and SEED_PASSWORD (at least 8 characters) before seeding');
    }
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task_management');

    await User.deleteMany({});
    await Task.deleteMany({});

    const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD, 10);
    const user = await User.create({
      name: 'Demo User',
      email: process.env.SEED_EMAIL,
      password: passwordHash,
    });

    await Task.insertMany([
      {
        title: 'Prepare sprint plan',
        description: 'Create the sprint backlog for this week.',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000),
        userId: user._id,
      },
      {
        title: 'Review design updates',
        description: 'Check the latest UI mockups before handoff.',
        status: 'in-progress',
        priority: 'medium',
        dueDate: new Date(Date.now() + 172800000),
        userId: user._id,
      },
    ]);

    console.log('Seed data complete');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedData();
