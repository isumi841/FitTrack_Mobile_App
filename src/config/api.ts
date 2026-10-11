// Expo inlines public variables only when accessed with direct dot notation.
// Use your computer's LAN IP here via .env.local when testing on a phone.
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configuredApiUrl || 'http://localhost:5001').replace(/\/+$/, '');
