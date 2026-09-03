require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

async function cleanOrphanedAccounts() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/seatplus';
  console.log('Connecting to MongoDB...');
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    
    const accounts = await db.collection('accounts').find({}).toArray();
    console.log(`Found ${accounts.length} accounts in total.`);
    
    let deletedCount = 0;
    for (const acc of accounts) {
      // Look for the user in users collection
      const user = await db.collection('users').findOne({ 
        $or: [
          { _id: acc.userId },
          { id: acc.userId },
          { _id: typeof acc.userId === 'string' && acc.userId.length === 24 ? new (require('mongodb').ObjectId)(acc.userId) : null }
        ].filter(Boolean)
      });
      
      if (!user) {
        console.log(`Deleting orphaned account record: provider=${acc.providerId}, accountId=${acc.accountId}, missing userId=${acc.userId}`);
        await db.collection('accounts').deleteOne({ _id: acc._id });
        deletedCount++;
      }
    }
    
    console.log(`✅ Cleanup complete: Removed ${deletedCount} orphaned account records.`);
    console.log('You can now log in / register with Google without the "unable_to_link_account" error!');
  } catch (err) {
    console.error('Error cleaning accounts:', err);
  } finally {
    await client.close();
  }
}

cleanOrphanedAccounts();
