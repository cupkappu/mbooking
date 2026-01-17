/**
 * Multi-Currency Accounting - Docker Configuration Validation
 *
 * Simple validation that Docker files are syntactically valid.
 * Full Docker build and integration tests run in CI pipeline.
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
const YAML = require('yaml');

const PROJECT_ROOT = '/Users/kifuko/dev/multi_currency_accounting';
const BACKEND_DIR = `${PROJECT_ROOT}/backend`;
const FRONTEND_DIR = `${PROJECT_ROOT}/frontend`;
const DOCKER_COMPOSE_FILE = `${PROJECT_ROOT}/docker-compose.yml`;

// ============================================================================
// DOCKER FILE VALIDATION
// ============================================================================

describe('Docker Configuration', () => {
  describe('docker-compose.yml', () => {
    it('should exist', () => {
      expect(fs.existsSync(DOCKER_COMPOSE_FILE)).toBe(true);
    });

    it('should be valid YAML', () => {
      const content = fs.readFileSync(DOCKER_COMPOSE_FILE, 'utf-8');
      expect(() => YAML.parse(content)).not.toThrow();
    });
  });

  describe('Dockerfiles', () => {
    it('backend Dockerfile should exist', () => {
      expect(fs.existsSync(`${BACKEND_DIR}/Dockerfile`)).toBe(true);
    });

    it('frontend Dockerfile should exist', () => {
      expect(fs.existsSync(`${FRONTEND_DIR}/Dockerfile`)).toBe(true);
    });

    it('Dockerfiles should not be empty', () => {
      const backend = fs.readFileSync(`${BACKEND_DIR}/Dockerfile`, 'utf-8');
      const frontend = fs.readFileSync(`${FRONTEND_DIR}/Dockerfile`, 'utf-8');
      expect(backend.length).toBeGreaterThan(100);
      expect(frontend.length).toBeGreaterThan(100);
    });
  });
});
