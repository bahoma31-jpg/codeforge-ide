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

// ─── Verification Engine ──────────────────────────────────────

/**
 * VerificationEngine — Post-execution validator.
 *
 * Performs these checks:
 * 1. File existence — all modified files still exist
 * 2. Import validity — all imports resolve to real files
 * 3. Export consistency — exported symbols are actually defined
 * 4. No protected file modifications
 * 5. No unrelated changes (diff scope check)
 * 6. Syntax sanity (basic bracket/parenthesis matching)
 */
export class VerificationEngine {
  /**
   * Verify all changes made during the ACT phase.
   */
  async verify(
    task: SelfImprovementTask,
    allFiles: Map<string, string>,
    changes: FileChange[]
  ): Promise<VerificationResult> {
    const checks: VerificationCheck[] = [];

    // Check 1: File existence
    checks.push(this.checkFileExistence(changes, allFiles));

    // Check 2: Import validity
    checks.push(this.checkImportValidity(changes, allFiles));

    // Check 3: Export consistency
    checks.push(this.checkExportConsistency(changes, allFiles));

    // Check 4: Protected paths
    checks.push(this.checkProtectedPaths(changes, task));

    // Check 5: Scope integrity
    checks.push(this.checkScopeIntegrity(changes, task));

    // Check 6: Syntax sanity
    checks.push(this.checkSyntaxSanity(changes, allFiles));

    // Check 7: Downstream impact
    checks.push(this.checkDownstreamImpact(changes, allFiles));

    // Aggregate results
    const failedChecks = checks.filter(c => !c.passed);
    const passed = failedChecks.length === 0;
    const retryNeeded = failedChecks.some(c =>
      c.name === 'import_validity' ||
      c.name === 'syntax_sanity' ||
      c.name === 'export_consistency'
    );

    return {
      passed,
      checks,
      retryNeeded,
      reason: passed
        ? undefined
        : `Failed checks: ${failedChecks.map(c => c.name).join(', ')}`,
    };
  }

  // ─── Individual Checks ────────────────────────────────────

  /** Check 1: All modified files still exist in the project */
  private checkFileExistence(
    changes: FileChange[],
    allFiles: Map<string, string>
  ): VerificationCheck {
    const missing: string[] = [];

    for (const change of changes) {
      if (change.changeType === 'delete') continue; // Expected to not exist
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

  /** Check 2: All imports in modified files resolve to real files */
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
        // Only check local imports (not node_modules)
        if (!imp.source.startsWith('.') && !imp.source.startsWith('@/')) continue;

        // Resolve the import path
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
        : `Broken imports: ${brokenImports.map(b => `${b.file} → ${b.import}`).join('; ')}`,
    };
  }

  /** Check 3: Exported symbols are actually defined in the file */
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

      // Clear cache to force re-analysis with new content
      engine.clearCache();
      const analysis = engine.analyzeComponent(change.filePath, content);

      // Check that exported symbols are defined in the file
      for (const exp of analysis.exports) {
        // Simple check: the symbol name should appear as a definition
        const definitionPatterns = [
          new RegExp(`(?:function|class|const|let|var|interface|type|enum)\\s+${exp}\\b`),
          new RegExp(`export\\s+default\\s+${exp}\\b`),
        ];

        const isDefined = definitionPatterns.some(p => p.test(content));
        if (!isDefined) {
          // Could be a re-export, check for that
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

  /** Check 4: No protected paths were modified */
  private checkProtectedPaths(
    changes: FileChange[],
    task: SelfImprovementTask
  ): VerificationCheck {
    const protectedPaths = task.orientation.constraints
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

  /** Check 5: Changes are within the declared scope */
  private checkScopeIntegrity(
    changes: FileChange[],
    task: SelfImprovementTask
  ): VerificationCheck {
    const scope = new Set(task.orientation.scope);
    const outOfScope: string[] = [];

    for (const change of changes) {
      if (
        (change.changeType === 'modify' || change.changeType === 'delete') &&
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

  /** Check 6: Basic syntax sanity (bracket matching) */
  private checkSyntaxSanity(
    changes: FileChange[],
    allFiles: Map<string, string>
  ): VerificationCheck {
    const syntaxErrors: string[] = [];

    for (const change of changes) {
      if (change.changeType === 'delete') continue;
      const content = allFiles.get(change.filePath);
      if (!content) continue;

      // Skip non-code files
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

  /** Check 7: Downstream files that import changed files are not broken */
  private checkDownstreamImpact(
    changes: FileChange[],
    allFiles: Map<string, string>
  ): VerificationCheck {
    const engine = getSelfAnalysisEngine();
    const issues: string[] = [];
    const modifiedFiles = new Set(changes.filter(c => c.changeType !== 'delete').map(c => c.filePath));
    const deletedFiles = new Set(changes.filter(c => c.changeType === 'delete').map(c => c.filePath));

    // Check all files that import from deleted files
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

    // Check that modified files still export symbols that downstream files need
    for (const modifiedFile of modifiedFiles) {
      const newContent = allFiles.get(modifiedFile);
      if (!newContent) continue;

      engine.clearCache();
      const newAnalysis = engine.analyzeComponent(modifiedFile, newContent);
      const newExports = new Set(newAnalysis.exports);

      // Find files that import from this modified file
      for (const [filePath, content] of allFiles.entries()) {
        if (filePath === modifiedFile) continue;
        const analysis = engine.analyzeComponent(filePath, content);

        for (const imp of analysis.imports) {
          const resolved = this.resolveImport(filePath, imp.source, allFiles);
          if (resolved === modifiedFile) {
            // Check if imported symbols still exist
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

  /** Check bracket/parenthesis/brace balance in code */
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

      // Track line numbers
      if (c === '\n') {
        lineNum++;
        inLineComment = false;
        continue;
      }

      // Skip comments
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

      // Skip strings
      if (inString) {
        if (c === stringChar && prev !== '\\') inString = false;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') {
        inString = true;
        stringChar = c;
        continue;
      }

      // Track brackets
      if (pairs[c]) {
        stack.push({ char: c, line: lineNum });
      } else if (closers.has(c)) {
        const last = stack.pop();
        if (!last) {
          issues.push(`${filePath}:${lineNum} — unexpected '${c}' with no matching opener`);
        } else if (pairs[last.char] !== c) {
          issues.push(
            `${filePath}:${lineNum} — mismatched '${c}', expected '${pairs[last.char]}' (opened at line ${last.line})`
          );
        }
      }
    }

    // Check unclosed brackets
    for (const unclosed of stack) {
      issues.push(
        `${filePath}:${unclosed.line} — unclosed '${unclosed.char}'`
      );
    }

    return issues;
  }

  /** Resolve an import path relative to the importing file */
  private resolveImport(
    fromFile: string,
    importSource: string,
    allFiles: Map<string, string>
  ): string | null {
    if (!importSource.startsWith('.') && !importSource.startsWith('@/')) {
      return null; // Node module import
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
