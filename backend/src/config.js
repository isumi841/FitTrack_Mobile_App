import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const ENV_FILE = fileURLToPath(new URL('../.env', import.meta.url));

export class ConfigurationError extends Error {}

const placeholder = /<[^>]*>|\b(?:db_password|your_password|your_mongodb_uri|changeme|change_me|replace_me)\b/i;

export function parseEnvironment(env) {
  const required = ['PORT', 'NODE_ENV', 'MONGODB_URI', 'CORS_ORIGINS'];
  const missing = required.filter(key => typeof env[key] !== 'string' || !env[key].trim());
  if (missing.length) {
    throw new ConfigurationError(`Missing required settings: ${missing.join(', ')}. Configure backend/.env using .env.example.`);
  }

  const portText = env.PORT.trim();
  const port = Number(portText);
  if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigurationError('PORT must be a whole number between 1 and 65535. Use 5001 for local development.');
  }
  const nodeEnv = env.NODE_ENV.trim();
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new ConfigurationError('NODE_ENV must be development, test, or production.');
  }

  const mongodbUri = env.MONGODB_URI.trim();
  let decodedUri;
  try {
    decodedUri = decodeURIComponent(mongodbUri);
  } catch {
    throw new ConfigurationError('MONGODB_URI contains invalid percent encoding. URL-encode special characters in the password.');
  }
  if (placeholder.test(decodedUri)) {
    throw new ConfigurationError('MONGODB_URI still contains a placeholder. Replace <db_password> locally in backend/.env.');
  }
  if (!/^mongodb(?:\+srv)?:\/\/[^\s]+$/.test(mongodbUri)) {
    throw new ConfigurationError('MONGODB_URI must be a valid mongodb:// or mongodb+srv:// connection string.');
  }
  // Validate the Atlas URI without ever including its value in an error.
  if (mongodbUri.startsWith('mongodb+srv://')) {
    let uri;
    try {
      uri = new URL(mongodbUri);
    } catch {
      throw new ConfigurationError('MONGODB_URI is malformed. Check the Atlas connection string in backend/.env.');
    }
    if (!uri.hostname || uri.port || !uri.username || !uri.password || uri.pathname.length < 2 || uri.hash) {
      throw new ConfigurationError('The Atlas URI needs a hostname, username, password, and database name, with no port or fragment.');
    }
  }

  const corsOrigins = [...new Set(env.CORS_ORIGINS.split(',').map(origin => origin.trim()))];
  for (const origin of corsOrigins) {
    let url;
    try {
      url = new URL(origin);
    } catch {
      throw new ConfigurationError('CORS_ORIGINS must contain comma-separated HTTP(S) origins, such as http://localhost:8081.');
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || url.username || url.password) {
      throw new ConfigurationError('CORS_ORIGINS must contain exact HTTP(S) origins without paths, credentials, wildcards, or trailing slashes.');
    }
  }
  if (env.MEMBER3_DEV_AUTH && !['true', 'false'].includes(env.MEMBER3_DEV_AUTH)) throw new ConfigurationError('MEMBER3_DEV_AUTH must be true or false.');
  const devAuthEnabled = env.MEMBER3_DEV_AUTH === 'true';
  const devAuthToken = env.MEMBER3_DEV_TOKEN ?? '';
  if (devAuthEnabled) {
    if (nodeEnv !== 'development') throw new ConfigurationError('Development identity is forbidden outside NODE_ENV=development.');
    if (!/^[a-f0-9]{64}$/i.test(devAuthToken) || new Set(devAuthToken.toLowerCase()).size < 12) throw new ConfigurationError('MEMBER3_DEV_TOKEN must be a privately generated random 32-byte hexadecimal token.');
    if (!/^mongodb(?:\+srv)?:\/\/[^/]+\/test(?:\?|$)/.test(mongodbUri)) throw new ConfigurationError('Development sessions require the explicitly named test database.');
  }
  if (env.ADMIN_DEV_AUTH && !['true', 'false'].includes(env.ADMIN_DEV_AUTH)) throw new ConfigurationError('ADMIN_DEV_AUTH must be true or false.');
  const adminDevAuthEnabled = env.ADMIN_DEV_AUTH === 'true';
  const adminDevToken = env.ADMIN_DEV_TOKEN ?? '';
  if (adminDevAuthEnabled) {
    if (nodeEnv !== 'development') throw new ConfigurationError('Development admin identity is forbidden outside NODE_ENV=development.');
    if (!/^[a-f0-9]{64}$/i.test(adminDevToken) || new Set(adminDevToken.toLowerCase()).size < 12 || adminDevToken === devAuthToken) throw new ConfigurationError('ADMIN_DEV_TOKEN must be a separate privately generated random 32-byte hexadecimal token.');
    if (!/^mongodb(?:\+srv)?:\/\/[^/]+\/test(?:\?|$)/.test(mongodbUri)) throw new ConfigurationError('Development exercises require the explicitly named test database.');
  }
  return { port, nodeEnv, mongodbUri, corsOrigins, devAuthEnabled, devAuthToken, adminDevAuthEnabled, adminDevToken, host: devAuthEnabled || adminDevAuthEnabled ? '127.0.0.1' : undefined };
}

export function loadConfig({ envFile = ENV_FILE, env = process.env } = {}) {
  // Resolving relative to this module makes npm --prefix and direct node starts reliable.
  // Existing shell variables take precedence; dotenv never overwrites them or the file.
  const result = dotenv.config({ path: envFile, processEnv: env, quiet: true, override: false });
  if (result.error && result.error.code !== 'ENOENT') {
    throw new ConfigurationError('Unable to read backend/.env. Check local file permissions.');
  }
  return parseEnvironment(env);
}
