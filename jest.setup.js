// Jest setup file: ensure test environment variables are defined and load .env.test if present
const { config: dotenvConfig } = require('dotenv');
const { join } = require('path');

// Load .env.test if it exists, otherwise fall back to .env
dotenvConfig({ path: join(process.cwd(), '.env.test') });
dotenvConfig({ path: join(process.cwd(), '.env') });

// Ensure essential env vars for tests
// Force the public API base URL for tests so they are deterministic and don't pick up local .env values
process.env.NUXT_PUBLIC_API_BASE = 'http://localhost:3000';
// Optional minimal Firebase client config for tests
process.env.NUXT_PUBLIC_FIREBASE_API_KEY = process.env.NUXT_PUBLIC_FIREBASE_API_KEY || 'test-api-key';
process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'localhost';
process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-project';

// Silence noisy logs during tests
process.env.LOG_LEVEL = 'error';

// Provide a global fetch mock for tests that do not mock fetch explicitly
if (typeof global.fetch === 'undefined') {
	global.fetch = jest.fn(async (url, options) => ({ ok: false, status: 503, statusText: 'Service Unavailable' }));
}
