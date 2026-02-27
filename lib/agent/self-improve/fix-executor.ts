/**
 * CodeForge IDE — Fix Executor
 * Converts a fix plan (FixStep[]) into actual tool commands.
 * Handles file reading, editing, creation, and rollback.
 *
 * Phase 2: OODA Loop Implementation.
 */

import type {
  FixStep,
  FileChange,
} from './types';
import { getSelfAnalysisEngine } from './self-analysis-engine';

// ─── Tool Bridge Interface ────────────────────────────────────

export interface ToolBridge {
  readFile(filePath: string, branch?: string): Promise<string>;
  editFile(
    filePath: string,
    oldStr: string,
    newStr: string,
    commitMessage?: string,
    branch?: string
  ): Promise<boolean>;
  writeFile(
    filePath: string,
    content: string,
    commitMessage?: string,
    branch?: string
  ): Promise<boolean>;
  deleteFile(
    filePath: string,
    commitMessage?: string,
    branch?: string
  ): Promise<boolean>;
}

// ─── Execution Options ────────────────────────────────────────

export interface ExecutionOptions {
  protectedPaths: string[];
  maxFiles: number;
  dryRun?: boolean;
  branch?: string;
}

// ─── Plan Input (flat object form) ────────────────────────────

export interface PlanInput {
  steps: PlanStep[];
  protectedPaths: string[];
  maxFiles: number;
  dryRun?: boolean;
  branch?: string;
}

export interface PlanStep {
  type: string;
  filePath: string;
  description: string;
  oldStr?: string;
  newStr?: string;
}

// ─── Execution Result ─────────────────────────────────────────

export interface ExecutionResult {
  success: boolean;
  filesModified: string[];
  backupData: Map<string, string>;
  errors: string[];
  changes: FileChange[];
}

// ─── Fix Executor ─────────────────────────────────────────────

export class FixExecutor {
  private toolBridge: ToolBridge;
  private rollbackStack: FileChange[] = [];

  constructor(toolBridge: ToolBridge) {
    this.toolBridge = toolBridge;
  }

  /**
   * Execute a complete fix plan.
   * Accepts either:
   *   1. PlanInput (flat object with steps, protectedPaths, maxFiles)
   *   2. Legacy (plan, allFiles, options) — 3-arg form
   */
  async executePlan(
    planOrInput: FixStep[] | PlanInput | Record<string, unknown> | undefined | null,
    allFiles?: Map<string, string>,
    options?: ExecutionOptions
  ): Promise<ExecutionResult | FileChange[]> {
    // ── Detect flat PlanInput form ──
    if (
      planOrInput &&
      typeof planOrInput === 'object' &&
      !Array.isArray(planOrInput) &&
      'steps' in planOrInput &&
      Array.isArray((planOrInput as any).steps) &&
      'protectedPaths' in planOrInput
    ) {
      return this.executePlanFlat(planOrInput as PlanInput);
    }

    // ── Legacy 3-arg form ──
    return this.executePlanLegacy(planOrInput, allFiles!, options!);
  }

  /**
   * Flat form: executePlan({ steps, protectedPaths, maxFiles, dryRun? })
   */
  private async executePlanFlat(input: PlanInput): Promise<ExecutionResult> {
    const backupData = new Map<string, string>();
    const filesModified: string[] = [];
    const errors: string[] = [];
    const changes: FileChange[] = [];
    let filesModifiedCount = 0;

    for (const step of input.steps) {
      const filePath = step.filePath;
      const action = step.type;

      // Protected path check
      if (this.isProtected(filePath, input.protectedPaths)) {
        continue;
      }

      // Max files check
      if (
        (action === 'edit' || action === 'create' || action === 'delete') &&
        filesModifiedCount >= input.maxFiles
      ) {
        continue;
      }

      try {
        if (action === 'read') {
          await this.toolBridge.readFile(filePath);
        } else if (action === 'edit') {
          // Backup before editing
          try {
            const currentContent = await this.toolBridge.readFile(filePath);
            backupData.set(filePath, currentContent);
          } catch {
            // File might not exist yet
          }

          if (input.dryRun) {
            // Dry run — don't actually edit
          } else {
            const oldStr = step.oldStr || '';
            const newStr = step.newStr || '';
            const success = await this.toolBridge.editFile(filePath, oldStr, newStr);
            if (success && !filesModified.includes(filePath)) {
              filesModified.push(filePath);
              filesModifiedCount++;
            }
          }

          changes.push({
            filePath,
            changeType: 'modify',
            oldContent: backupData.get(filePath),
            timestamp: Date.now(),
          });
        } else if (action === 'create') {
          if (!input.dryRun) {
            await this.toolBridge.writeFile(filePath, step.newStr || '');
            if (!filesModified.includes(filePath)) {
              filesModified.push(filePath);
              filesModifiedCount++;
            }
          }
          changes.push({
            filePath,
            changeType: 'create',
            timestamp: Date.now(),
          });
        } else if (action === 'delete') {
          try {
            const currentContent = await this.toolBridge.readFile(filePath);
            backupData.set(filePath, currentContent);
          } catch { /* ignore */ }

          if (!input.dryRun) {
            await this.toolBridge.deleteFile(filePath);
            if (!filesModified.includes(filePath)) {
              filesModified.push(filePath);
              filesModifiedCount++;
            }
          }
          changes.push({
            filePath,
            changeType: 'delete',
            oldContent: backupData.get(filePath),
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        errors.push(`${action} ${filePath}: ${(error as Error).message}`);
        continue;
      }
    }

    this.rollbackStack = changes;

    return {
      success: errors.length === 0,
      filesModified,
      backupData,
      errors,
      changes,
    };
  }

  /**
   * Legacy 3-arg form for backward compatibility.
   */
  private async executePlanLegacy(
    plan: FixStep[] | Record<string, unknown> | undefined | null,
    allFiles: Map<string, string>,
    options: ExecutionOptions
  ): Promise<FileChange[]> {
    const changes: FileChange[] = [];
    this.rollbackStack = [];
    let filesModified = 0;

    let safePlan: FixStep[];
    if (Array.isArray(plan)) {
      safePlan = plan;
    } else if (plan && typeof plan === 'object' && 'steps' in plan && Array.isArray((plan as any).steps)) {
      safePlan = (plan as any).steps;
    } else if (plan && typeof plan === 'object') {
      safePlan = [plan as unknown as FixStep];
    } else {
      safePlan = [];
    }

    const sortedPlan = [...safePlan].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (const step of sortedPlan) {
      if (step.completed) continue;

      if (this.isProtected(step.target, options.protectedPaths)) {
        step.completed = true;
        step.result = `SKIPPED — ${step.target} is a protected path`;
        continue;
      }

      if (
        (step.action === 'edit' || step.action === 'create' || step.action === 'delete') &&
        filesModified >= options.maxFiles
      ) {
        step.completed = true;
        step.result = `SKIPPED — max file limit (${options.maxFiles}) reached`;
        continue;
      }

      try {
        const change = await this.executeStep(step, allFiles, options);
        if (change) {
          changes.push(change);
          this.rollbackStack.push(change);
          if (change.changeType !== 'modify' || change.newContent !== change.oldContent) {
            filesModified++;
          }
        }
        step.completed = true;
      } catch (error) {
        step.completed = true;
        step.result = `ERROR: ${(error as Error).message}`;
        continue;
      }
    }

    return changes;
  }

  /**
   * Rollback changes. Accepts either:
   *   - Map<string, string> (backupData from flat form)
   *   - ExecutionOptions (legacy form)
   */
  async rollback(
    backupOrOptions?: Map<string, string> | ExecutionOptions
  ): Promise<number> {
    let rolledBack = 0;

    if (backupOrOptions instanceof Map) {
      for (const [filePath, content] of backupOrOptions) {
        try {
          await this.toolBridge.writeFile(
            filePath,
            content,
            `rollback: Restore ${filePath.split('/').pop()} to pre-fix state`
          );
          rolledBack++;
        } catch (error) {
          console.error(`Rollback failed for ${filePath}: ${(error as Error).message}`);
        }
      }
      return rolledBack;
    }

    const stack = [...this.rollbackStack].reverse();
    const branch = (backupOrOptions as ExecutionOptions)?.branch;

    for (const change of stack) {
      try {
        if (change.changeType === 'modify' && change.oldContent !== undefined) {
          await this.toolBridge.writeFile(
            change.filePath,
            change.oldContent,
            `rollback: Restore ${change.filePath.split('/').pop()} to pre-fix state`,
            branch
          );
          rolledBack++;
        } else if (change.changeType === 'create') {
          await this.toolBridge.deleteFile(
            change.filePath,
            `rollback: Remove ${change.filePath.split('/').pop()} (created during fix)`,
            branch
          );
          rolledBack++;
        } else if (change.changeType === 'delete' && change.oldContent !== undefined) {
          await this.toolBridge.writeFile(
            change.filePath,
            change.oldContent,
            `rollback: Restore deleted ${change.filePath.split('/').pop()}`,
            branch
          );
          rolledBack++;
        }
      } catch (error) {
        console.error(`Rollback failed for ${change.filePath}: ${(error as Error).message}`);
      }
    }

    this.rollbackStack = [];
    return rolledBack;
  }

  getRollbackStack(): FileChange[] {
    return [...this.rollbackStack];
  }

  // ─── Private: Step Execution (Legacy) ──────────────────────

  private async executeStep(
    step: FixStep,
    allFiles: Map<string, string>,
    options: ExecutionOptions
  ): Promise<FileChange | null> {
    switch (step.action) {
      case 'read':
        return this.executeRead(step, allFiles, options);
      case 'analyze':
        return this.executeAnalyze(step, allFiles);
      case 'edit':
        return this.executeEdit(step, allFiles, options);
      case 'create':
        return this.executeCreate(step, allFiles, options);
      case 'delete':
        return this.executeDelete(step, allFiles, options);
      case 'verify':
        step.result = 'Verification delegated to VerificationEngine';
        return null;
      default:
        step.result = `Unknown action: ${step.action}`;
        return null;
    }
  }

  private async executeRead(
    step: FixStep,
    allFiles: Map<string, string>,
    options: ExecutionOptions
  ): Promise<FileChange | null> {
    let content = allFiles.get(step.target);
    if (!content) {
      content = await this.toolBridge.readFile(step.target, options.branch);
      allFiles.set(step.target, content);
    }
    step.result = `Read ${content.length} characters from ${step.target}`;
    return null;
  }

  private async executeAnalyze(
    step: FixStep,
    allFiles: Map<string, string>
  ): Promise<FileChange | null> {
    const engine = getSelfAnalysisEngine();
    const content = allFiles.get(step.target);
    if (content) {
      const analysis = engine.analyzeComponent(step.target, content);
      step.result = `Analyzed: type=${analysis.type}, complexity=${analysis.estimatedComplexity}, deps=${analysis.dependencies.length}`;
    } else {
      step.result = `Cannot analyze — file not found: ${step.target}`;
    }
    return null;
  }

  private async executeEdit(
    step: FixStep,
    allFiles: Map<string, string>,
    options: ExecutionOptions
  ): Promise<FileChange> {
    const oldContent = allFiles.get(step.target);
    if (!oldContent) {
      throw new Error(`Cannot edit ${step.target} — file not loaded. Read it first.`);
    }

    if (options.dryRun) {
      step.result = `DRY RUN — would edit ${step.target}`;
      return {
        filePath: step.target,
        changeType: 'modify',
        oldContent,
        newContent: oldContent,
        timestamp: Date.now(),
      };
    }

    step.result = `Edit prepared for ${step.target} — agent will provide specific changes`;
    return {
      filePath: step.target,
      changeType: 'modify',
      oldContent,
      timestamp: Date.now(),
    };
  }

  private async executeCreate(
    step: FixStep,
    allFiles: Map<string, string>,
    options: ExecutionOptions
  ): Promise<FileChange> {
    if (options.dryRun) {
      step.result = `DRY RUN — would create ${step.target}`;
      return {
        filePath: step.target,
        changeType: 'create',
        timestamp: Date.now(),
      };
    }
    step.result = `Create prepared for ${step.target} — agent will provide content`;
    return {
      filePath: step.target,
      changeType: 'create',
      timestamp: Date.now(),
    };
  }

  private async executeDelete(
    step: FixStep,
    allFiles: Map<string, string>,
    options: ExecutionOptions
  ): Promise<FileChange> {
    const oldContent = allFiles.get(step.target);
    if (options.dryRun) {
      step.result = `DRY RUN — would delete ${step.target}`;
      return {
        filePath: step.target,
        changeType: 'delete',
        oldContent,
        timestamp: Date.now(),
      };
    }
    step.result = `Delete prepared for ${step.target} — requires user confirmation`;
    return {
      filePath: step.target,
      changeType: 'delete',
      oldContent,
      timestamp: Date.now(),
    };
  }

  private isProtected(filePath: string, protectedPaths: string[]): boolean {
    return protectedPaths.some(p => filePath.startsWith(p) || filePath === p);
  }
}
