/**
 * CodeForge IDE — Verification Engine
 * Validates changes after the ACT phase of the OODA loop.
 * Checks imports, exports, side effects, and overall integrity.
 *
 * Phase 2: OODA Loop Implementation.
 */

import type {
  SelfImprovementTask,
  FileChange,
  VerificationResult,
  VerificationCheck,
} from './types';
import { getSelfAnalysisEngine } from './self-analysis-engine';

// ─── Flat Verify Input (used by unit tests) ───────────────────

export interface VerifyInput {
  modifiedFiles: string[];
  declaredScope: string[];
  allFiles: Map<string, string>;
  protectedPaths: string[];
}

// ─── Verification Engine ──────────────────────────────────────

export class VerificationEngine {
  /**
   * Verify changes. Accepts either:
   *   1. Flat form: verify({ modifiedFiles, declaredScope, allFiles, protectedPaths })
   *   2. Legacy form: verify(task, allFiles, changes)
   */
  verify(
    taskOrInput: SelfImprovementTask | VerifyInput,
    allFilesArg?: Map<string, string>,
    changes?: FileChange[] | Record<string, unknown> | null
  ): VerificationResult {
    // ── Detect flat VerifyInput form ──
    if (
      taskOrInput &&
      typeof taskOrInput === 'object' &&
      'modifiedFiles' in taskOrInput &&
      'allFiles' in taskOrInput &&
      'protectedPaths' in taskOrInput
    ) {
      return this.verifyFlat(taskOrInput as VerifyInput);
    }

    // ── Legacy 3-arg form ──
    return this.verifyLegacy(
      taskOrInput as SelfImprovementTask,
      allFilesArg!,
      changes
    );
  }

  // ─── Flat Form Implementation ──────────────────────────────

  private verifyFlat(input: VerifyInput): VerificationResult {
    const checks: VerificationCheck[] = [];

    // Check 1: File existence
    checks.push(this.checkFileExistenceFlat(input));

    // Check 2: Import validity
    checks.push(this.checkImportValidityFlat(input));

    // Check 3: Protected paths
    checks.push(this.checkProtectedPathsFlat(input));

    // Check 4: Scope integrity
    checks.push(this.checkScopeIntegrityFlat(input));

    // Check 5: Syntax sanity
    checks.push(this.checkSyntaxSanityFlat(input));

    const failedChecks = checks.filter(c => !c.passed);
    const passed = failedChecks.length === 0;
    const score = checks.length > 0
      ? checks.filter(c => c.passed).length / checks.length
      : 0;

    return {
      passed,
      checks,
      score,
      retryNeeded: failedChecks.some(c =>
        c.name === 'import_validity' || c.name === 'syntax_sanity'
      ),
      reason: passed
        ? undefined
        : `Failed checks: ${failedChecks.map(c => c.name).join(', ')}`,
    };
  }

  private checkFileExistenceFlat(input: VerifyInput): VerificationCheck {
    const missing: string[] = [];
    for (const file of input.modifiedFiles) {
      if (!input.allFiles.has(file)) {
        missing.push(file);
      }
    }
    return {
      name: 'file_existence',
      passed: missing.length === 0,
      details: missing.length === 0
        ? `All ${input.modifiedFiles.length} modified files exist`
        : `Missing files: ${missing.join(', ')}`,
    };
  }

  private checkImportValidityFlat(input: VerifyInput): VerificationCheck {
    const brokenImports: Array<{ file: string; import: string }> = [];

    for (const file of input.modifiedFiles) {
      const content = input.allFiles.get(file);
      if (!content) continue;

      // Extract import statements
      const importRegex = /import\s+(?:.*?)\s+from\s+['"]([^'"]+)['"]/g;
      let match: RegExpExecArray | null;
      while ((match = importRegex.exec(content)) !== null) {
        const source = match[1];
        // Skip npm packages (don't start with . or @/)
        if (!source.startsWith('.') && !source.startsWith('@/')) continue;

        const resolved = this.resolveImport(file, source, input.allFiles);
        if (!resolved) {
          brokenImports.push({ file, import: source });
        }
      }
    }

    return {
      name: 'import_validity',
      passed: brokenImports.length === 0,
      details: brokenImports.length === 0
        ? 'All local imports resolve correctly'
        : `Broken imports: ${brokenImports.map(b => `${b.file} \u2192 ${b.import}`).join('; ')}`,
    };
  }

  private checkProtectedPathsFlat(input: VerifyInput): VerificationCheck {
    const violations: string[] = [];
    for (const file of input.modifiedFiles) {
      for (const pp of input.protectedPaths) {
        if (file.startsWith(pp) || file === pp) {
          violations.push(`${file} (protected: ${pp})`);
        }
      }
    }
    return {
      name: 'protected_paths',
      passed: violations.length === 0,
      details: violations.length === 0
        ? 'No protected paths were modified'
        : `VIOLATION: Modified protected paths: ${violations.join('; ')}`,
    };
  }

  private checkScopeIntegrityFlat(input: VerifyInput): VerificationCheck {
    const scope = new Set(input.declaredScope);
    const outOfScope: string[] = [];
    for (const file of input.modifiedFiles) {
      if (scope.size > 0 && !scope.has(file)) {
        outOfScope.push(file);
      }
    }
    return {
      name: 'scope_integrity',
      passed: outOfScope.length === 0,
      details: outOfScope.length === 0
        ? `All changes within declared scope (${scope.size} files)`
        : `Out-of-scope modifications: ${outOfScope.join('; ')}`,
    };
  }

  private checkSyntaxSanityFlat(input: VerifyInput): VerificationCheck {
    const syntaxErrors: string[] = [];
    for (const file of input.modifiedFiles) {
      const content = input.allFiles.get(file);
      if (!content) continue;
      if (!file.match(/\.(ts|tsx|js|jsx|json)$/)) continue;
      const issues = this.checkBracketBalance(content, file);
      syntaxErrors.push(...issues);
    }
    return {
      name: 'syntax_sanity',
      passed: syntaxErrors.length === 0,
      details: syntaxErrors.length === 0
        ? 'All files pass basic syntax check'
        : `Syntax issues: ${syntaxErrors.join('; ')}`,
    };
  }

  // ─── Legacy Form Implementation ────────────────────────────

  private verifyLegacy(
    task: SelfImprovementTask,
    allFiles: Map<string, string>,
    changes?: FileChange[] | Record<string, unknown> | null
  ): VerificationResult {
    let safeChanges: FileChange[];
    if (Array.isArray(changes)) {
      safeChanges = changes;
    } else if (changes && typeof changes === 'object' && 'items' in changes && Array.isArray((changes as any).items)) {
      safeChanges = (changes as any).items;
    } else if (changes && typeof changes === 'object' && !Array.isArray(changes)) {
      safeChanges = [changes as unknown as FileChange];
    } else {
      safeChanges = [];
    }

    const checks: VerificationCheck[] = [];

    checks.push(this.checkFileExistence(safeChanges, allFiles));
    checks.push(this.checkImportValidity(safeChanges, allFiles));
    checks.push(this.checkExportConsistency(safeChanges, allFiles));
    checks.push(this.checkProtectedPaths(safeChanges, task));
    checks.push(this.checkScopeIntegrity(safeChanges, task));
    checks.push(this.checkSyntaxSanity(safeChanges, allFiles));
    checks.push(this.checkDownstreamImpact(safeChanges, allFiles));

    const failedChecks = checks.filter(c => !c.passed);
    const passed = failedChecks.length === 0;
    const retryNeeded = failedChecks.some(c =>
      c.name === 'import_validity' ||
      c.name === 'syntax_sanity' ||
      c.name === 'export_consistency'
    );
    const score = checks.length > 0
      ? checks.filter(c => c.passed).length / checks.length
      : 0;

    return {
      passed,
      checks,
      score,
      retryNeeded,
      reason: passed
        ? undefined
        : `Failed checks: ${failedChecks.map(c => c.name).join(', ')}`,
    };
  }

  // ─── Legacy Individual Checks ──────────────────────────────

  private checkFileExistence(
    changes: FileChange[],
    allFiles: Map<string, string>
  ): VerificationCheck {
    const missing: string[] = [];
    for (const change of changes) {
      if (change.changeType === 'delete') continue;
      if (!allFiles.has(change.filePath)) {
        missing.push(change.filePath);
      }
    }
    return {
      name: 'file_existence',
      passed: missing.length === 0,
      details: missing.length === 0
        ? `All ${changes.length} modified files exist`
        : `Missing files: ${missing.join(', ')}`,
    };
  }

  private checkImportValidity(
    changes: FileChange[],
    allFiles: Map<string, string>
  ): VerificationCheck {
    const brokenImports: Array<{ file: string; import: string }> = [];
    const engine = getSelfAnalysisEngine();

    for (const change of changes) {
      if (change.changeType === 'delete') continue;
      const content = allFiles.get(change.filePath);
      if (!content) continue;

      const analysis = engine.analyzeComponent(change.filePath, content);

      for (const imp of analysis.imports) {
        if (!imp.source.startsWith('.') && !imp.source.startsWith('@/')) continue;
        const resolved = this.resolveImport(change.filePath, imp.source, allFiles);
        if (!resolved) {
          brokenImports.push({ file: change.filePath, import: imp.source });
        }
      }
    }

    return {
      name: 'import_validity',
      passed: brokenImports.length === 0,
      details: brokenImports.length === 0
        ? 'All local imports resolve correctly'
        : `Broken imports: ${brokenImports.map(b => `${b.file} \u2192 ${b.import}`).join('; ')}`,
    };
  }

  private checkExportConsistency(
    changes: FileChange[],
    allFiles: Map<string, string>
  ): VerificationCheck {
    const issues: string[] = [];
    const engine = getSelfAnalysisEngine();

    for (const change of changes) {
      if (change.changeType === 'delete') continue;
      const content = allFiles.get(change.filePath);
      if (!content) continue;

      engine.clearCache();
      const analysis = engine.analyzeComponent(change.filePath, content);

      for (const exp of analysis.exports) {
        const definitionPatterns = [
          new RegExp(`(?:function|class|const|let|var|interface|type|enum)\\s+${exp}\\b`),
          new RegExp(`export\\s+default\\s+${exp}\\b`),
        ];

        const isDefined = definitionPatterns.some(p => p.test(content));
        if (!isDefined) {
          const isReExport = content.includes(`export { ${exp}`) || content.includes(`export {${exp}`);
          if (!isReExport) {
            issues.push(`${change.filePath}: exported '${exp}' may not be defined`);
          }
        }
      }
    }

    return {
      name: 'export_consistency',
      passed: issues.length === 0,
      details: issues.length === 0
        ? 'All exports are properly defined'
        : `Export issues: ${issues.join('; ')}`,
    };
  }

  private checkProtectedPaths(
    changes: FileChange[],
    task: SelfImprovementTask
  ): VerificationCheck {
    const protectedPaths = (task.orientation?.constraints || [])
      .filter(c => c.startsWith('Protected:'))
      .map(c => c.replace('Protected: ', ''));

    const violations: string[] = [];
    for (const change of changes) {
      if (change.changeType === 'modify' || change.changeType === 'delete') {
        for (const pp of protectedPaths) {
          if (change.filePath.startsWith(pp)) {
            violations.push(`${change.filePath} (protected: ${pp})`);
          }
        }
      }
    }

    return {
      name: 'protected_paths',
      passed: violations.length === 0,
      details: violations.length === 0
        ? 'No protected paths were modified'
        : `VIOLATION: Modified protected paths: ${violations.join('; ')}`,
    };
  }

  private checkScopeIntegrity(
    changes: FileChange[],
    task: SelfImprovementTask
  ): VerificationCheck {
    const scope = new Set(task.orientation?.scope || []);
    const outOfScope: string[] = [];

    for (const change of changes) {
      if (
        (change.changeType === 'modify' || change.changeType === 'delete') &&
        scope.size > 0 &&
        !scope.has(change.filePath)
      ) {
        outOfScope.push(change.filePath);
      }
    }

    return {
      name: 'scope_integrity',
      passed: outOfScope.length === 0,
      details: outOfScope.length === 0
        ? `All changes within declared scope (${scope.size} files)`
        : `Out-of-scope modifications: ${outOfScope.join('; ')}`,
    };
  }

  private checkSyntaxSanity(
    changes: FileChange[],
    allFiles: Map<string, string>
  ): VerificationCheck {
    const syntaxErrors: string[] = [];

    for (const change of changes) {
      if (change.changeType === 'delete') continue;
      const content = allFiles.get(change.filePath);
      if (!content) continue;
      if (!change.filePath.match(/\.(ts|tsx|js|jsx|json)$/)) continue;
      const issues = this.checkBracketBalance(content, change.filePath);
      syntaxErrors.push(...issues);
    }

    return {
      name: 'syntax_sanity',
      passed: syntaxErrors.length === 0,
      details: syntaxErrors.length === 0
        ? 'All files pass basic syntax check'
        : `Syntax issues: ${syntaxErrors.join('; ')}`,
    };
  }

  private checkDownstreamImpact(
    changes: FileChange[],
    allFiles: Map<string, string>
  ): VerificationCheck {
    const engine = getSelfAnalysisEngine();
    const issues: string[] = [];
    const modifiedFiles = new Set(changes.filter(c => c.changeType !== 'delete').map(c => c.filePath));
    const deletedFiles = new Set(changes.filter(c => c.changeType === 'delete').map(c => c.filePath));

    for (const deletedFile of deletedFiles) {
      for (const [filePath, content] of allFiles.entries()) {
        if (deletedFiles.has(filePath)) continue;
        const analysis = engine.analyzeComponent(filePath, content);
        for (const imp of analysis.imports) {
          const resolved = this.resolveImport(filePath, imp.source, allFiles);
          if (resolved && deletedFiles.has(resolved)) {
            issues.push(`${filePath} imports from deleted file ${resolved}`);
          }
        }
      }
    }

    for (const modifiedFile of modifiedFiles) {
      const newContent = allFiles.get(modifiedFile);
      if (!newContent) continue;

      engine.clearCache();
      const newAnalysis = engine.analyzeComponent(modifiedFile, newContent);
      const newExports = new Set(newAnalysis.exports);

      for (const [filePath, content] of allFiles.entries()) {
        if (filePath === modifiedFile) continue;
        const analysis = engine.analyzeComponent(filePath, content);
        for (const imp of analysis.imports) {
          const resolved = this.resolveImport(filePath, imp.source, allFiles);
          if (resolved === modifiedFile) {
            for (const symbol of imp.symbols) {
              if (symbol && !newExports.has(symbol)) {
                issues.push(
                  `${filePath} imports '${symbol}' from ${modifiedFile} but it's no longer exported`
                );
              }
            }
          }
        }
      }
    }

    return {
      name: 'downstream_impact',
      passed: issues.length === 0,
      details: issues.length === 0
        ? 'No downstream files are broken'
        : `Downstream issues: ${issues.join('; ')}`,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────

  private checkBracketBalance(content: string, filePath: string): string[] {
    const issues: string[] = [];
    const stack: Array<{ char: string; line: number }> = [];
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const closers = new Set(Object.values(pairs));
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let inLineComment = false;
    let lineNum = 1;

    for (let i = 0; i < content.length; i++) {
      const c = content[i];
      const next = content[i + 1];
      const prev = content[i - 1];

      if (c === '\n') {
        lineNum++;
        inLineComment = false;
        continue;
      }

      if (inLineComment) continue;
      if (inComment) {
        if (c === '*' && next === '/') {
          inComment = false;
          i++;
        }
        continue;
      }
      if (c === '/' && next === '/') { inLineComment = true; continue; }
      if (c === '/' && next === '*') { inComment = true; i++; continue; }

      if (inString) {
        if (c === stringChar && prev !== '\\') inString = false;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') {
        inString = true;
        stringChar = c;
        continue;
      }

      if (pairs[c]) {
        stack.push({ char: c, line: lineNum });
      } else if (closers.has(c)) {
        const last = stack.pop();
        if (!last) {
          issues.push(`${filePath}:${lineNum} \u2014 unexpected '${c}' with no matching opener`);
        } else if (pairs[last.char] !== c) {
          issues.push(
            `${filePath}:${lineNum} \u2014 mismatched '${c}', expected '${pairs[last.char]}' (opened at line ${last.line})`
          );
        }
      }
    }

    for (const unclosed of stack) {
      issues.push(
        `${filePath}:${unclosed.line} \u2014 unclosed '${unclosed.char}'`
      );
    }

    return issues;
  }

  private resolveImport(
    fromFile: string,
    importSource: string,
    allFiles: Map<string, string>
  ): string | null {
    if (!importSource.startsWith('.') && !importSource.startsWith('@/')) {
      return null;
    }

    let resolvedBase: string;

    if (importSource.startsWith('@/')) {
      resolvedBase = importSource.replace('@/', '');
    } else {
      const fromDir = fromFile.split('/').slice(0, -1).join('/');
      const parts = importSource.split('/');
      const baseParts = fromDir.split('/').filter(Boolean);

      for (const part of parts) {
        if (part === '..') baseParts.pop();
        else if (part !== '.') baseParts.push(part);
      }
      resolvedBase = baseParts.join('/');
    }

    const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
    for (const ext of extensions) {
      const candidate = resolvedBase + ext;
      if (allFiles.has(candidate)) return candidate;
    }

    return null;
  }
}
