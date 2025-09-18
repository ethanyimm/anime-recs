import { Platform } from 'react-native';

// Optional: set your LAN IP here for local device testing
const LAN_IP = '192.168.1.42';

// Change this to your current Cloudflare Tunnel URL when using it
const CLOUDFLARE_URL = 'https://interpretation-ended-twelve-thinking.trycloudflare.com';

// In dev: 
// - On web → use localhost
// - On device → use LAN IP
// - Or override with Cloudflare Tunnel if you want remote access
export const BASE_URL =
  process.env.NODE_ENV === 'development'
    ? (Platform.OS === 'web'
        ? 'http://localhost:4000'
        : CLOUDFLARE_URL || `http://${LAN_IP}:4000`)
    : 'https://your-deployed-backend.com';