import { Platform } from 'react-native';

// Replace with your LAN IP
const LAN_IP = '192.168.1.42';

export const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:4000' : `http://${LAN_IP}:4000`;