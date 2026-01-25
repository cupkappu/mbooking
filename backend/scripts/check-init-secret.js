#!/usr/bin/env node
/**
 * Check and generate INIT_SECRET if not set.
 * This script runs before the NestJS application to ensure INIT_SECRET
 * is available for ConfigModule.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = path.join(__dirname, '..', '.env');
const SECRET_LENGTH = 32;

function generateSecureSecret(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

function readEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (err) {
    console.error(`Failed to read .env file: ${err.message}`);
  }
  return '';
}

function writeEnvFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (err) {
    console.error(`Failed to write .env file: ${err.message}`);
    process.exit(1);
  }
}

function updateEnvFile(content, key, value) {
  const lines = content.split('\n');
  let found = false;
  const updatedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith(`${key}=`) || trimmed.startsWith(`# ${key}`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    updatedLines.push(`${key}=${value}`);
  }

  return updatedLines.join('\n');
}

function main() {
  const existingSecret = process.env.INIT_SECRET;

  if (existingSecret) {
    console.log('INIT_SECRET is already set');
    return;
  }

  console.log('============================================================');
  console.log('INIT_SECRET not found - generating one for you...');

  const newSecret = generateSecureSecret(SECRET_LENGTH);
  const envContent = readEnvFile(ENV_PATH);
  const updatedContent = updateEnvFile(envContent, 'INIT_SECRET', newSecret);

  writeEnvFile(ENV_PATH, updatedContent);

  console.log(`INIT_SECRET: ${newSecret}`);
  console.log('Saved to .env file');
  console.log('============================================================');
}

main();
