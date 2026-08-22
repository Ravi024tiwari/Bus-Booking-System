import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User } from './models';
import dns from 'dns';

// Fix for Node DNS resolution issues on some Windows systems
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  console.warn('[DNS] Failed to set Google DNS servers:', err);
}

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;

if (!mongoUri) {
  console.error('Error: MONGODB_URI or MONGODB_URL is not defined in your environment variables.');
  process.exit(1);
}

async function run() {
  await mongoose.connect(mongoUri!);
  console.log('Connected to Database.');
  
  const email = 'operator@royaltravels.com';
  const user = await User.findOne({ email });
  if (!user) {
    console.error('Operator user not found!');
    process.exit(1);
  }

  const currentStatus = user.operatorApprovalStatus;
  let newStatus = 'PENDING';
  
  if (process.argv[2] === 'REJECTED') {
    newStatus = 'REJECTED';
  } else if (process.argv[2] === 'APPROVED') {
    newStatus = 'APPROVED';
  } else if (currentStatus === 'PENDING') {
    newStatus = 'APPROVED';
  }

  user.operatorApprovalStatus = newStatus as any;
  await user.save();
  console.log(`Updated operator ${email} status from ${currentStatus} to ${newStatus}`);

  // Clear redis cache for this user
  try {
    const redis = require('./lib/redis').default;
    const cacheKey = `user:profile:${user._id}`;
    await redis.del(cacheKey);
    console.log(`Cleared redis cache for key: ${cacheKey}`);
  } catch (err) {
    console.log('Redis key clear skipped or failed.');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
