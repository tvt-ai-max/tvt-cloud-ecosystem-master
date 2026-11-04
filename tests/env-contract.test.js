const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const envPath = path.join(__dirname, '..', '.env.production.example');
const envContent = fs.readFileSync(envPath, 'utf8');

const envKeys = envContent
  .split('\n')
  .filter(line => line.trim() && !line.trim().startsWith('#'))
  .map(line => line.split('=')[0].trim());

describe('.env.production.example', () => {
  it('should exist and be readable', () => {
    assert.ok(fs.existsSync(envPath), '.env.production.example must exist');
  });

  const requiredKeys = [
    'NODE_ENV',
    'TZ',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_URL',
    'SCANNER_API_KEY',
    'SCANNER_PDF_DIR',
    'SCANNER_TIMEOUT',
    'VIETQR_WEBHOOK_SECRET',
    'BANK_ACCOUNT_NO',
    'BANK_BIN',
    'BILLING_API_KEY',
    'OPENAI_API_KEY',
    'OPENAI_MODEL',
    'RAG_TOP_K',
    'CONCIERGE_API_KEY',
    'GOOGLE_PLACES_API_KEY',
    'GOOGLE_PLACE_ID',
    'REVIEW_API_KEY',
    'API_DOMAIN',
    'VPS_IP',
  ];

  for (const key of requiredKeys) {
    it(`should contain ${key}`, () => {
      assert.ok(envKeys.includes(key), `missing required key: ${key}`);
    });
  }

  it('should have values (not empty) for all defined keys', () => {
    const lines = envContent
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('#'));

    for (const line of lines) {
      const parts = line.split('=');
      assert.ok(parts.length >= 2, `line should have key=value format: ${line}`);
      const value = parts.slice(1).join('=').trim();
      assert.ok(value.length > 0, `key ${parts[0]} must have a value`);
    }
  });
});
