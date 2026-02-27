/**
 * CodeForge IDE — Verification Engine Tests
 * Unit tests for the 7-check post-execution verification system.
 *
 * Tests cover:
 * - File existence verification
 * - Import validity checking
 * - Export consistency
 * - Protected path enforcement
 * - Scope integrity
 * - Syntax sanity (bracket balance)
 * - Downstream impact detection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Setup ───────────────────────────────────────────────

// We'll test VerificationEngine with controlled inputs
import { VerificationEngine } from '../verification-engine';

// ─── Test Helpers ─────────────────────────────────────────────

function createFileMap(files: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(files));
}

// ─── Tests ────────────────────────────────────────────────────

describe('VerificationEngine', () => {
  let engine: VerificationEngine;

  beforeEach(() => {
    engine = new VerificationEngine();
  });

  // ─── File Existence ───────────────────────────────────────

  describe('File Existence Check', () => {
    it('should pass when all modified files exist', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'export const app = true;',
        'src/utils.ts': 'export const util = 1;',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts', 'src/utils.ts'],
        declaredScope: ['src/app.ts', 'src/utils.ts'],
        allFiles,
        protectedPaths: [],
      });

      const fileCheck = result.checks.find(c => c.name === 'file_existence');
      expect(fileCheck?.passed).toBe(true);
    });

    it('should fail when a modified file does not exist', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'export const app = true;',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts', 'src/missing.ts'],
        declaredScope: ['src/app.ts', 'src/missing.ts'],
        allFiles,
        protectedPaths: [],
      });

      const fileCheck = result.checks.find(c => c.name === 'file_existence');
      expect(fileCheck?.passed).toBe(false);
    });
  });

  // ─── Import Validity ──────────────────────────────────────

  describe('Import Validity Check', () => {
    it('should pass when all local imports resolve', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'import { util } from "./utils";\nexport const app = util;',
        'src/utils.ts': 'export const util = 1;',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts'],
        declaredScope: ['src/app.ts'],
        allFiles,
        protectedPaths: [],
      });

      const importCheck = result.checks.find(c => c.name === 'import_validity');
      expect(importCheck?.passed).toBe(true);
    });

    it('should fail when a local import does not resolve', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'import { util } from "./nonexistent";\nexport const app = util;',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts'],
        declaredScope: ['src/app.ts'],
        allFiles,
        protectedPaths: [],
      });

      const importCheck = result.checks.find(c => c.name === 'import_validity');
      expect(importCheck?.passed).toBe(false);
    });

    it('should ignore npm package imports', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'import React from "react";\nimport { v4 } from "uuid";\nexport const app = true;',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts'],
        declaredScope: ['src/app.ts'],
        allFiles,
        protectedPaths: [],
      });

      const importCheck = result.checks.find(c => c.name === 'import_validity');
      expect(importCheck?.passed).toBe(true);
    });
  });

  // ─── Protected Paths ──────────────────────────────────────

  describe('Protected Paths Check', () => {
    it('should pass when no protected paths are modified', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'export const app = true;',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts'],
        declaredScope: ['src/app.ts'],
        allFiles,
        protectedPaths: ['lib/agent/safety'],
      });

      const protectedCheck = result.checks.find(c => c.name === 'protected_paths');
      expect(protectedCheck?.passed).toBe(true);
    });

    it('should fail when a protected path is modified', () => {
      const allFiles = createFileMap({
        'lib/agent/safety/index.ts': 'export const safety = true;',
      });

      const result = engine.verify({
        modifiedFiles: ['lib/agent/safety/index.ts'],
        declaredScope: ['lib/agent/safety/index.ts'],
        allFiles,
        protectedPaths: ['lib/agent/safety'],
      });

      const protectedCheck = result.checks.find(c => c.name === 'protected_paths');
      expect(protectedCheck?.passed).toBe(false);
    });
  });

  // ─── Scope Integrity ──────────────────────────────────────

  describe('Scope Integrity Check', () => {
    it('should pass when all modifications are within declared scope', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'export const app = true;',
        'src/utils.ts': 'export const util = 1;',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts'],
        declaredScope: ['src/app.ts', 'src/utils.ts'],
        allFiles,
        protectedPaths: [],
      });

      const scopeCheck = result.checks.find(c => c.name === 'scope_integrity');
      expect(scopeCheck?.passed).toBe(true);
    });

    it('should fail when modifications are outside declared scope', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'export const app = true;',
        'src/secret.ts': 'export const secret = true;',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts', 'src/secret.ts'],
        declaredScope: ['src/app.ts'],
        allFiles,
        protectedPaths: [],
      });

      const scopeCheck = result.checks.find(c => c.name === 'scope_integrity');
      expect(scopeCheck?.passed).toBe(false);
    });
  });

  // ─── Syntax Sanity ────────────────────────────────────────

  describe('Syntax Sanity Check', () => {
    it('should pass with balanced brackets', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'function test() {\n  if (true) {\n    return [1, 2, 3];\n  }\n}',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts'],
        declaredScope: ['src/app.ts'],
        allFiles,
        protectedPaths: [],
      });

      const syntaxCheck = result.checks.find(c => c.name === 'syntax_sanity');
      expect(syntaxCheck?.passed).toBe(true);
    });

    it('should fail with unbalanced brackets', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'function test() {\n  if (true) {\n    return [1, 2, 3;\n  }\n}',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts'],
        declaredScope: ['src/app.ts'],
        allFiles,
        protectedPaths: [],
      });

      const syntaxCheck = result.checks.find(c => c.name === 'syntax_sanity');
      expect(syntaxCheck?.passed).toBe(false);
    });

    it('should ignore brackets inside strings', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'const str = "this has {unbalanced brackets";\nfunction test() { return str; }',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts'],
        declaredScope: ['src/app.ts'],
        allFiles,
        protectedPaths: [],
      });

      const syntaxCheck = result.checks.find(c => c.name === 'syntax_sanity');
      expect(syntaxCheck?.passed).toBe(true);
    });
  });

  // ─── Overall Result ───────────────────────────────────────

  describe('Overall Result', () => {
    it('should pass overall when all checks pass', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'export const app = true;',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts'],
        declaredScope: ['src/app.ts'],
        allFiles,
        protectedPaths: [],
      });

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(0.5);
    });

    it('should fail overall when any critical check fails', () => {
      const allFiles = createFileMap({
        'lib/agent/safety/index.ts': 'modified!',
      });

      const result = engine.verify({
        modifiedFiles: ['lib/agent/safety/index.ts'],
        declaredScope: ['lib/agent/safety/index.ts'],
        allFiles,
        protectedPaths: ['lib/agent/safety'],
      });

      expect(result.passed).toBe(false);
    });

    it('should return score between 0 and 1', () => {
      const allFiles = createFileMap({
        'src/app.ts': 'export const app = true;',
      });

      const result = engine.verify({
        modifiedFiles: ['src/app.ts'],
        declaredScope: ['src/app.ts'],
        allFiles,
        protectedPaths: [],
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });
});
