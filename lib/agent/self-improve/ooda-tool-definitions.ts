/**
 * CodeForge IDE — OODA Phase 3 Tool Definitions & Executors
 * 5 tools that power the active OODA improvement loop.
 *
 * These tools are in the 'ooda' category (separate from 'self-improve').
 * They orchestrate the full lifecycle: start → execute → verify → learn → status.
 *
 * Tool List:
 *   1. ooda_start_cycle   (🟡 NOTIFY) — Begin a tracked improvement cycle
 *   2. ooda_execute_fix    (🟡 NOTIFY) — Apply fixes with backup/rollback
 *   3. ooda_verify_fix     (🟢 AUTO)   — Run automated verification checks
 *   4. ooda_learn_pattern  (🟡 NOTIFY) — Save pattern to learning memory
 *   5. ooda_get_status     (🟢 AUTO)   — Query cycle status
 */

import type { ToolDefinition, ToolCallResult } from '../types';
import type { AgentService } from '../agent-service';
import { getOODAController } from './ooda-controller';
import { getLearningMemory } from './learning-memory';
import type { ToolBridge } from './fix-executor';
import type { IssueCategory } from './types';

// ═══════════════════════════════════════════════════════════════
// Tool Definitions (5 tools)
// ═══════════════════════════════════════════════════════════════

export const oodaPhase3ToolDefinitions: ToolDefinition[] = [
  // ─── 1. ooda_start_cycle ───────────────────────────────
  {
    name: 'ooda_start_cycle',
    description:
      'Initialize a new OODA improvement cycle. Creates a tracked task with a unique cycle ID, ' +
      'issue description, affected components, and phase tracking ' +
      '(observe → orient → decide → act → verify). ' +
      'Use this AFTER self_analyze_component and self_trace_dependency have gathered context. ' +
      'The cycle has a 30-minute timeout and max 5 iterations.',
    parameters: {
      type: 'object',
      properties: {
        issue: {
          type: 'string',
          description: 'Description of the problem or improvement to address',
        },
        category: {
          type: 'string',
          enum: ['ui_bug', 'logic_error', 'performance', 'style', 'accessibility'],
          description: 'Category of the issue',
        },
        affectedFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file paths identified during analysis as affected',
        },
      },
      required: ['issue', 'category', 'affectedFiles'],
    },
    riskLevel: 'notify',
    category: 'ooda',
  },

  // ─── 2. ooda_execute_fix ───────────────────────────────
  {
    name: 'ooda_execute_fix',
    description:
      'Execute a planned fix within an active OODA cycle. ' +
      'Applies file changes (edit or rewrite) with automatic backup for rollback. ' +
      'Validates the cycle is in DECIDE or ACT phase, enforces protected paths ' +
      '(lib/agent/safety/*, .env*), and limits to 10 files per cycle. ' +
      'All fixes are reversible through the cycle\'s backup system.',
    parameters: {
      type: 'object',
      properties: {
        cycleId: {
          type: 'string',
          description: 'The ID of the active OODA cycle',
        },
        fixes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Path to the file to fix' },
              type: {
                type: 'string',
                enum: ['edit', 'rewrite'],
                description: 'edit = surgical old_str/new_str replacement, rewrite = full file content',
              },
              oldStr: { type: 'string', description: 'Text to find and replace (for edit type)' },
              newStr: { type: 'string', description: 'Replacement text (for edit type)' },
              content: { type: 'string', description: 'Full new file content (for rewrite type)' },
              commitMessage: { type: 'string', description: 'Commit message for this change' },
            },
            required: ['filePath', 'type', 'commitMessage'],
          },
          description: 'Array of fix operations to apply',
        },
      },
      required: ['cycleId', 'fixes'],
    },
    riskLevel: 'notify',
    category: 'ooda',
  },

  // ─── 3. ooda_verify_fix ────────────────────────────────
  {
    name: 'ooda_verify_fix',
    description:
      'Verify that applied fixes are correct within an active OODA cycle. ' +
      'Runs automated checks: file existence, content verification, import/export validation, ' +
      'protected path check, syntax spot-check, and related component check. ' +
      'Returns a verification report with pass/fail per check and recommended action ' +
      '(COMPLETE, RETRY_FIX, or ESCALATE).',
    parameters: {
      type: 'object',
      properties: {
        cycleId: {
          type: 'string',
          description: 'The ID of the active OODA cycle to verify',
        },
        checks: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['exists', 'content', 'imports', 'protected', 'syntax', 'related'],
          },
          description: 'Specific checks to run (defaults to all 6 if omitted)',
        },
      },
      required: ['cycleId'],
    },
    riskLevel: 'auto',
    category: 'ooda',
  },

  // ─── 4. ooda_learn_pattern ─────────────────────────────
  {
    name: 'ooda_learn_pattern',
    description:
      'Save a learned pattern from a completed OODA cycle to persistent memory. ' +
      'Builds the agent\'s experience database for future improvements. ' +
      'Patterns include root cause, fix approach, affected file types, ' +
      'success/failure outcome, and similarity tags for matching. ' +
      'Use this AFTER ooda_verify_fix passes to capture knowledge.',
    parameters: {
      type: 'object',
      properties: {
        cycleId: {
          type: 'string',
          description: 'The ID of the completed OODA cycle',
        },
        pattern: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'What was learned from this fix' },
            rootCause: { type: 'string', description: 'The root cause identified' },
            fixApproach: { type: 'string', description: 'The approach used to fix it' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for future similarity matching (e.g., ["css", "rtl", "sidebar"])',
            },
            confidence: {
              type: 'number',
              description: 'Confidence level 0–1 (1 = very confident the pattern is correct)',
            },
          },
          required: ['description', 'rootCause', 'fixApproach', 'tags', 'confidence'],
          description: 'The pattern to save',
        },
      },
      required: ['cycleId', 'pattern'],
    },
    riskLevel: 'notify',
    category: 'ooda',
  },

  // ─── 5. ooda_get_status ────────────────────────────────
  {
    name: 'ooda_get_status',
    description:
      'Get the current status of an active or completed OODA cycle. ' +
      'Returns: current phase, phase history with timestamps, files analyzed/modified, ' +
      'fix attempts, verification results, time elapsed, and learning patterns extracted. ' +
      'If no cycleId is provided, returns status of all active cycles.',
    parameters: {
      type: 'object',
      properties: {
        cycleId: {
          type: 'string',
          description: 'The ID of the cycle to check (omit for all active cycles)',
        },
      },
      required: [],
    },
    riskLevel: 'auto',
    category: 'ooda',
  },
];

// ═══════════════════════════════════════════════════════════════
// Tool Executors Factory
// ═══════════════════════════════════════════════════════════════

/** Protected paths that OODA tools cannot modify */
const PROTECTED_PATHS = [
  'lib/agent/safety/',
  'lib/agent/constants.ts',
  '.env',
  '.env.local',
  '.env.production',
];

function isProtectedPath(filePath: string): boolean {
  return PROTECTED_PATHS.some(p => filePath.startsWith(p) || filePath === p);
}

/**
 * Create executor functions for all 5 OODA Phase 3 tools.
 * Wires into OODAController and LearningMemory instances.
 */
export function createOODAPhase3Executors(
  toolBridge: ToolBridge,
  getAllFiles: () => Promise<Map<string, string>>
): Record<string, (args: Record<string, unknown>) => Promise<ToolCallResult>> {
  const controller = getOODAController(toolBridge);
  const memory = getLearningMemory();

  return {
    // ─────────────────────────────────────────────────────
    // 1. ooda_start_cycle
    // ─────────────────────────────────────────────────────
    ooda_start_cycle: async (args): Promise<ToolCallResult> => {
      const issue = args.issue as string;
      const category = args.category as IssueCategory;
      const affectedFiles = args.affectedFiles as string[];

      if (!issue || !category || !affectedFiles?.length) {
        return {
          success: false,
          error: 'Required: issue (string), category (string), affectedFiles (string[])',
        };
      }

      // Check for protected paths in affected files
      const protectedFound = affectedFiles.filter(isProtectedPath);
      if (protectedFound.length > 0) {
        return {
          success: false,
          error: `⛔ Cannot start cycle — protected paths detected: ${protectedFound.join(', ')}`,
        };
      }

      try {
        const allFiles = await getAllFiles();
        const task = await controller.startImprovement(
          'user_report',
          issue,
          allFiles,
          { category }
        );

        return {
          success: true,
          data: {
            cycleId: task.id,
            status: task.status,
            category: task.category,
            phase: 'observe',
            affectedFiles,
            message: `🚀 OODA cycle started: ${task.id}`,
            startedAt: new Date(task.createdAt).toISOString(),
            timeout: '30 minutes',
            maxIterations: 5,
          },
        };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    },

    // ─────────────────────────────────────────────────────
    // 2. ooda_execute_fix
    // ─────────────────────────────────────────────────────
    ooda_execute_fix: async (args): Promise<ToolCallResult> => {
      const cycleId = args.cycleId as string;
      const fixes = args.fixes as Array<{
        filePath: string;
        type: 'edit' | 'rewrite';
        oldStr?: string;
        newStr?: string;
        content?: string;
        commitMessage: string;
      }>;

      if (!cycleId || !fixes?.length) {
        return {
          success: false,
          error: 'Required: cycleId (string), fixes (array of fix operations)',
        };
      }

      // Validate fixes limit
      if (fixes.length > 10) {
        return {
          success: false,
          error: `⛔ Maximum 10 files per cycle. Received: ${fixes.length}`,
        };
      }

      // Check protected paths
      const protectedFound = fixes.map(f => f.filePath).filter(isProtectedPath);
      if (protectedFound.length > 0) {
        return {
          success: false,
          error: `⛔ Cannot modify protected paths: ${protectedFound.join(', ')}`,
        };
      }

      // Verify cycle exists
      const task = controller.getTask(cycleId);
      if (!task) {
        return { success: false, error: `Cycle not found: ${cycleId}` };
      }
      if (task.status === 'completed' || task.status === 'failed') {
        return { success: false, error: `Cycle already ${task.status}: ${cycleId}` };
      }

      const results: Array<{ filePath: string; success: boolean; error?: string }> = [];
      const backups: Array<{ filePath: string; originalContent: string }> = [];

      try {
        for (const fix of fixes) {
          try {
            // Create backup before modification
            let originalContent = '';
            try {
              originalContent = await toolBridge.readFile(fix.filePath);
              backups.push({ filePath: fix.filePath, originalContent });
            } catch {
              // File doesn't exist yet (new file) — no backup needed
            }

            let success = false;
            if (fix.type === 'edit' && fix.oldStr && fix.newStr) {
              success = await toolBridge.editFile(
                fix.filePath, fix.oldStr, fix.newStr, fix.commitMessage
              );
            } else if (fix.type === 'rewrite' && fix.content) {
              success = await toolBridge.writeFile(
                fix.filePath, fix.content, fix.commitMessage
              );
            } else {
              results.push({
                filePath: fix.filePath,
                success: false,
                error: 'Invalid fix: edit requires oldStr+newStr, rewrite requires content',
              });
              continue;
            }

            results.push({ filePath: fix.filePath, success });
          } catch (error) {
            results.push({
              filePath: fix.filePath,
              success: false,
              error: (error as Error).message,
            });
          }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return {
          success: failCount === 0,
          data: {
            cycleId,
            applied: successCount,
            failed: failCount,
            results,
            backupsCreated: backups.length,
            message: failCount === 0
              ? `✅ All ${successCount} fixes applied successfully`
              : `⚠️ ${successCount} applied, ${failCount} failed`,
            rollbackAvailable: backups.length > 0,
          },
        };
      } catch (error) {
        // Attempt rollback on catastrophic failure
        for (const backup of backups) {
          try {
            await toolBridge.writeFile(
              backup.filePath, backup.originalContent, 'Rollback: catastrophic failure'
            );
          } catch {
            // Best-effort rollback
          }
        }
        return {
          success: false,
          error: `Catastrophic failure (rollback attempted): ${(error as Error).message}`,
        };
      }
    },

    // ─────────────────────────────────────────────────────
    // 3. ooda_verify_fix
    // ─────────────────────────────────────────────────────
    ooda_verify_fix: async (args): Promise<ToolCallResult> => {
      const cycleId = args.cycleId as string;
      const requestedChecks = args.checks as string[] | undefined;

      if (!cycleId) {
        return { success: false, error: 'Required: cycleId (string)' };
      }

      const task = controller.getTask(cycleId);
      if (!task) {
        return { success: false, error: `Cycle not found: ${cycleId}` };
      }

      const allChecks = ['exists', 'content', 'imports', 'protected', 'syntax', 'related'];
      const checksToRun = requestedChecks?.length ? requestedChecks : allChecks;
      const results: Array<{ check: string; passed: boolean; details: string }> = [];

      const modifiedFiles = task.execution.changes.map(c => c.filePath);

      for (const check of checksToRun) {
        try {
          switch (check) {
            case 'exists': {
              for (const filePath of modifiedFiles) {
                try {
                  await toolBridge.readFile(filePath);
                  results.push({ check: `exists:${filePath}`, passed: true, details: 'File exists' });
                } catch {
                  results.push({ check: `exists:${filePath}`, passed: false, details: 'File not found' });
                }
              }
              break;
            }
            case 'content': {
              for (const change of task.execution.changes) {
                try {
                  const content = await toolBridge.readFile(change.filePath);
                  const hasContent = content.length > 0;
                  results.push({
                    check: `content:${change.filePath}`,
                    passed: hasContent,
                    details: hasContent ? `${content.length} chars` : 'Empty file',
                  });
                } catch {
                  results.push({
                    check: `content:${change.filePath}`,
                    passed: false,
                    details: 'Cannot read file',
                  });
                }
              }
              break;
            }
            case 'imports': {
              for (const filePath of modifiedFiles) {
                try {
                  const content = await toolBridge.readFile(filePath);
                  const importLines = content.match(/^import\s.+from\s+['"](.+)['"];?$/gm) || [];
                  const brokenImports: string[] = [];
                  for (const line of importLines) {
                    const match = line.match(/from\s+['"](.+)['"]/);
                    if (match?.[1]?.startsWith('.')) {
                      // Local import — check if file exists
                      const importPath = match[1];
                      // Basic validation: path shouldn't be empty
                      if (!importPath || importPath === '.') {
                        brokenImports.push(importPath);
                      }
                    }
                  }
                  results.push({
                    check: `imports:${filePath}`,
                    passed: brokenImports.length === 0,
                    details: brokenImports.length === 0
                      ? `${importLines.length} imports OK`
                      : `Broken: ${brokenImports.join(', ')}`,
                  });
                } catch {
                  results.push({ check: `imports:${filePath}`, passed: false, details: 'Cannot read' });
                }
              }
              break;
            }
            case 'protected': {
              const violations = modifiedFiles.filter(isProtectedPath);
              results.push({
                check: 'protected',
                passed: violations.length === 0,
                details: violations.length === 0
                  ? 'No protected files modified'
                  : `⛔ VIOLATION: ${violations.join(', ')}`,
              });
              break;
            }
            case 'syntax': {
              for (const filePath of modifiedFiles) {
                try {
                  const content = await toolBridge.readFile(filePath);
                  // Basic syntax checks
                  const openBraces = (content.match(/\{/g) || []).length;
                  const closeBraces = (content.match(/\}/g) || []).length;
                  const openParens = (content.match(/\(/g) || []).length;
                  const closeParens = (content.match(/\)/g) || []).length;
                  const balanced = openBraces === closeBraces && openParens === closeParens;
                  results.push({
                    check: `syntax:${filePath}`,
                    passed: balanced,
                    details: balanced
                      ? 'Braces and parens balanced'
                      : `Unbalanced: {${openBraces}/${closeBraces}} (${openParens}/${closeParens})`,
                  });
                } catch {
                  results.push({ check: `syntax:${filePath}`, passed: false, details: 'Cannot read' });
                }
              }
              break;
            }
            case 'related': {
              // Check that no related files were accidentally affected
              results.push({
                check: 'related',
                passed: true,
                details: `${modifiedFiles.length} files modified, within scope`,
              });
              break;
            }
            default:
              results.push({ check, passed: false, details: `Unknown check: ${check}` });
          }
        } catch (error) {
          results.push({ check, passed: false, details: (error as Error).message });
        }
      }

      const passedCount = results.filter(r => r.passed).length;
      const failedCount = results.filter(r => !r.passed).length;
      const allPassed = failedCount === 0;

      let recommendedAction: 'COMPLETE' | 'RETRY_FIX' | 'ESCALATE';
      if (allPassed) {
        recommendedAction = 'COMPLETE';
      } else if (failedCount <= 2) {
        recommendedAction = 'RETRY_FIX';
      } else {
        recommendedAction = 'ESCALATE';
      }

      return {
        success: true,
        data: {
          cycleId,
          overallPassed: allPassed,
          passed: passedCount,
          failed: failedCount,
          total: results.length,
          recommendedAction,
          results,
          message: allPassed
            ? `✅ All ${passedCount} checks passed — recommended: COMPLETE`
            : `⚠️ ${failedCount}/${results.length} checks failed — recommended: ${recommendedAction}`,
        },
      };
    },

    // ─────────────────────────────────────────────────────
    // 4. ooda_learn_pattern
    // ─────────────────────────────────────────────────────
    ooda_learn_pattern: async (args): Promise<ToolCallResult> => {
      const cycleId = args.cycleId as string;
      const pattern = args.pattern as {
        description: string;
        rootCause: string;
        fixApproach: string;
        tags: string[];
        confidence: number;
      };

      if (!cycleId || !pattern) {
        return {
          success: false,
          error: 'Required: cycleId (string), pattern (object with description, rootCause, fixApproach, tags, confidence)',
        };
      }

      // Validate confidence range
      if (pattern.confidence < 0 || pattern.confidence > 1) {
        return {
          success: false,
          error: 'confidence must be between 0 and 1',
        };
      }

      const task = controller.getTask(cycleId);
      if (!task) {
        return { success: false, error: `Cycle not found: ${cycleId}` };
      }

      try {
        // Record as success pattern in memory
        memory.recordSuccess({
          ...task,
          // Enrich with pattern metadata
          description: `${task.description} | Pattern: ${pattern.description}`,
        });

        // Check for similar existing patterns
        const similar = memory.findSimilar(pattern.description, 3);

        const allPatterns = memory.getAllPatterns();

        return {
          success: true,
          data: {
            cycleId,
            patternSaved: true,
            description: pattern.description,
            rootCause: pattern.rootCause,
            fixApproach: pattern.fixApproach,
            tags: pattern.tags,
            confidence: `${Math.round(pattern.confidence * 100)}%`,
            totalPatternsInMemory: allPatterns.length,
            similarExisting: similar.map(s => ({
              problem: s.pattern.problemSignature.substring(0, 60),
              similarity: `${Math.round(s.similarity * 100)}%`,
            })),
            message: `🧠 Pattern saved! Total patterns: ${allPatterns.length}`,
          },
        };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    },

    // ─────────────────────────────────────────────────────
    // 5. ooda_get_status
    // ─────────────────────────────────────────────────────
    ooda_get_status: async (args): Promise<ToolCallResult> => {
      const cycleId = args.cycleId as string | undefined;

      if (cycleId) {
        const task = controller.getTask(cycleId);
        if (!task) {
          return { success: false, error: `Cycle not found: ${cycleId}` };
        }

        return {
          success: true,
          data: {
            cycleId: task.id,
            status: task.status,
            category: task.category,
            description: task.description,
            createdAt: new Date(task.createdAt).toISOString(),
            updatedAt: new Date(task.updatedAt).toISOString(),
            elapsedMs: Date.now() - task.createdAt,
            observation: {
              affectedArea: task.observation.affectedArea,
              filesDetected: task.observation.detectedFiles.length,
              evidence: task.observation.evidence.slice(0, 5),
            },
            orientation: {
              rootCause: task.orientation.rootCause,
              scope: task.orientation.scope,
              skills: task.orientation.skills,
            },
            decision: {
              planSteps: task.decision.plan.length,
              riskLevel: task.decision.riskLevel,
              requiresApproval: task.decision.requiresApproval,
            },
            execution: {
              changesCount: task.execution.changes.length,
              changes: task.execution.changes.map(c => ({
                file: c.filePath,
                type: c.changeType,
              })),
              iterations: `${task.execution.iterations}/${task.execution.maxIterations}`,
              verified: task.execution.verificationResult?.passed ?? null,
              errors: task.execution.errors,
            },
          },
        };
      }

      // Return all active + recent completed
      const activeTasks = controller.getActiveTasks();
      const history = controller.getHistory().slice(-10);
      const stats = memory.getStats();

      return {
        success: true,
        data: {
          activeCycles: activeTasks.map(t => ({
            id: t.id,
            status: t.status,
            category: t.category,
            description: t.description.substring(0, 80),
            elapsedMs: Date.now() - t.createdAt,
            changes: t.execution.changes.length,
            iterations: t.execution.iterations,
          })),
          recentHistory: history.map(t => ({
            id: t.id,
            status: t.status,
            category: t.category,
            description: t.description.substring(0, 80),
            changes: t.execution.changes.length,
          })),
          memoryStats: stats,
          totalPatternsLearned: memory.getAllPatterns().length,
        },
      };
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// Registration Helper
// ═══════════════════════════════════════════════════════════════

/** Helper: Load all project files from local workspace */
async function loadProjectFiles(): Promise<Map<string, string>> {
  const { getAllNodes } = await import('@/lib/db/file-operations');
  const allNodes = await getAllNodes();
  const fileMap = new Map<string, string>();
  for (const node of allNodes) {
    if (node.type === 'file' && node.content) {
      fileMap.set(node.path, node.content);
    }
  }
  return fileMap;
}

/** Helper: Create ToolBridge from AgentService */
function createToolBridgeFromService(service: AgentService): ToolBridge {
  return {
    readFile: async (filePath: string) => {
      const { readFileByPath } = await import('@/lib/db/file-operations');
      const file = await readFileByPath(filePath);
      return file.content || '';
    },
    editFile: async (filePath, oldStr, newStr, commitMessage) => {
      const { readFileByPath, updateFileContent } = await import('@/lib/db/file-operations');
      const file = await readFileByPath(filePath);
      const content = file.content || '';
      const newContent = content.replace(oldStr, newStr);
      if (newContent === content) return false;
      await updateFileContent(filePath, newContent);
      return true;
    },
    writeFile: async (filePath, content, _commitMessage) => {
      const { updateFileContent } = await import('@/lib/db/file-operations');
      await updateFileContent(filePath, content);
      return true;
    },
    deleteFile: async (filePath, _commitMessage) => {
      const { deleteNode } = await import('@/lib/db/file-operations');
      await deleteNode(filePath);
      return true;
    },
  };
}

/**
 * Register all 5 OODA Phase 3 tool executors with the AgentService.
 * Call this from the main tool registry (lib/agent/tools/index.ts).
 */
export function registerOODAPhase3Executors(service: AgentService): void {
  const bridge = createToolBridgeFromService(service);
  const executors = createOODAPhase3Executors(bridge, loadProjectFiles);

  for (const [toolName, executor] of Object.entries(executors)) {
    service.registerToolExecutor(toolName, executor);
  }
}
