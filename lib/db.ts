import mongoose from 'mongoose';
import dns from 'dns';

// Force Google DNS in development to bypass local VPN/WARP DNS failures for SRV records
if (process.env.NODE_ENV === 'development') {
  dns.setDefaultResultOrder('ipv4first');
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (err) {
    console.warn('[DNS] Failed to set Google DNS servers:', err);
  }
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

// Resolves SRV record and builds a non-SRV connection string
async function resolveMongoSrv(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) {
    return uri;
  }

  const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)(\/[^?]+)?(\?.+)?$/);
  if (!match) {
    return uri;
  }

  const [, username, password, srvHost, database = '', queryParams = ''] = match;
  
  const dnsServers = [['8.8.8.8', '8.8.4.4'], ['1.1.1.1', '1.0.0.1']];
  let srvRecords: any[] = [];
  let resolved = false;

  try {
    srvRecords = await dns.promises.resolveSrv(`_mongodb._tcp.${srvHost}`);
    resolved = true;
  } catch (err: any) {
    // Normal system DNS failed
  }

  if (!resolved) {
    for (const servers of dnsServers) {
      try {
        const resolver = new dns.promises.Resolver();
        resolver.setServers(servers);
        srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${srvHost}`);
        resolved = true;
        break;
      } catch (err: any) {
        // Fallback resolver failed
      }
    }
  }

  if (!resolved || srvRecords.length === 0) {
    return uri;
  }

  const hostList = srvRecords.map(r => `${r.name}:${r.port}`).join(',');

  let replicaSet = 'Cluster0-shard-0';
  try {
    let txtRecords: string[][] = [];
    try {
      txtRecords = await dns.promises.resolveTxt(srvHost);
    } catch {
      const resolver = new dns.promises.Resolver();
      resolver.setServers(['8.8.8.8', '1.1.1.1']);
      txtRecords = await resolver.resolveTxt(srvHost);
    }
    const txtLine = txtRecords.flat().find(line => line.includes('replicaSet='));
    if (txtLine) {
      const repMatch = txtLine.match(/replicaSet=([^&]+)/);
      if (repMatch) replicaSet = repMatch[1];
    }
  } catch (err) {
    // Fallback replicaSet defaults
  }

  const separator = queryParams.includes('?') ? '&' : '?';
  return `mongodb://${username}:${password}@${hostList}${database}${queryParams}${separator}ssl=true&authSource=admin&replicaSet=${replicaSet}`;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const currentUri = process.env.MONGODB_URI || process.env.MONGODB_URL || MONGODB_URI;
  if (!currentUri) {
    throw new Error('Please define the MONGODB_URI or MONGODB_URL environment variable inside .env');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = resolveMongoSrv(currentUri).then((resolvedUri) => {
      console.log('[Mongoose] Resolving DNS SRV for connection...');
      return mongoose.connect(resolvedUri, opts).then((mongooseInstance) => {
        console.log('[Mongoose] New connection established.');
        return mongooseInstance;
      });
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
