import * as dotenv from 'dotenv';
import dns from 'dns';

// Load environment variables
dotenv.config();

// Force Google DNS in development to bypass local VPN/WARP DNS failures
if (process.env.NODE_ENV !== 'production') {
  dns.setDefaultResultOrder('ipv4first');
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('[DNS] Forced Google DNS (8.8.8.8, 8.8.4.4) for connection bypass.');
  } catch (err) {
    console.warn('[DNS] Failed to set Google DNS servers:', err);
  }
}
