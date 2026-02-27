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

/**
 * ToolBridge — Abstraction layer between the FixExecutor and actual tool calls.
 * This allows the executor to work without directly depending on the agent's tool system.
 *
 * The consuming code (agent-service or tool executor) provides implementations
 * that map to the actual github_read_file, github_edit_file, etc.
 */
export interface ToolBridge {
  /** Read a file's content */
  readFile(filePath: string, branch?: string): Promise<string>;

  /** Edit a file with old_str → new_str replacement */
  editFile(
    filePath: string,
    oldStr: string,
    newStr: string,
    commitMessage: string,
    branch?: string
  ): Promise<boolean>;

  /** Create or overwrite a file */
  writeFile(
    filePath: string,
    content: string,
    commitMessage: string,
    branch?: string
  ): Promise<boolean>;

  /** Delete a file */
  deleteFile(
    filePath: string,
    commitMessage: string,
    branch?: string
  ): Promise<boolean>;
}

// ─── Execution Options ────────────────────────────────────────

export interface ExecutionOptions {
  /** Paths that cannot be modified */
  protectedPaths: string[];

  /** Maximum number of files that can be changed */
  maxFiles: number;

  /** If true, simulate execution without actually writing */
  dryRun: boolean;

  /** Branch to operate on */
  branch?: string;
}

// ─── Fix Executor ─────────────────────────────────────────────

/**
 * FixExecutor — Executes fix plans step by step.
 *
 * Responsibilities:
 * - Translate FixStep actions into tool bridge calls
 * - Track all file changes for rollback
 * - Enforce protection rules (protected paths, max files)
 * - Support dry-run mode for testing
 */
export class FixExecutor {
  private toolBridge: ToolBridge;
  private rollbackStack: FileChange[] = [];

  constructor(toolBridge: ToolBridge) {
    this.toolBridge = toolBridge;
  }

  /**
   * Execute a complete fix plan.
   * Returns the list of file changes made.
   */
  async executePlan(
    plan: FixStep[],
    allFiles: Map<string, string>,
    options: ExecutionOptions
  ): Promise<FileChange[]> {
    const changes: FileChange[] = [];
    this.rollbackStack = [];
    let filesModified = 0;

    // Sort plan by order
    const sortedPlan = [...plan].sort((a, b) => a.order - b.order);

    for (const step of sortedPlan) {
      // Skip already completed steps
      if (step.completed) continue;

      // Check protection
      if (this.isProtected(step.target, options.protectedPaths)) {
        step.completed = true;
        step.result = `SKIPPED — ${step.target} is a protected path`;
        continue;
      }

      // Check file limit
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
        throw error; // Let OODAController handle retries
      }
    }

    return changes;
  }

  /**
   * Rollback all changes made during the last execution.
   * Restores files to their original state.
   */
  async rollback(options: ExecutionOptions): Promise<number> {
    let rolledBack = 0;

    // Process in reverse order
    const stack = [...this.rollbackStack].reverse();

    for (const change of stack) {
      try {
        if (change.changeType === 'modify' && change.oldContent !== undefined) {
          // Restore original content
          await this.toolBridge.writeFile(
            change.filePath,
            change.oldContent,
            `rollback: Restore ${change.filePath.split('/').pop()} to pre-fix state`,
            options.branch
          );
          rolledBack++;
        } else if (change.changeType === 'create') {
          // Delete newly created file
          await this.toolBridge.deleteFile(
            change.filePath,
            `rollback: Remove ${change.filePath.split('/').pop()} (created during fix)`,
            options.branch
          );
          rolledBack++;
        } else if (change.changeType === 'delete' && change.oldContent !== undefined) {
          // Recreate deleted file
          await this.toolBridge.writeFile(
            change.filePath,
            change.oldContent,
            `rollback: Restore deleted ${change.filePath.split('/').pop()}`,
            options.branch
          );
          rolledBack++;
        }
      } catch (error) {
        // Log but continue rolling back other files
        console.error(`Rollback failed for ${change.filePath}: ${(error as Error).message}`);
      }
    }

    this.rollbackStack = [];
    return rolledBack;
  }

  /** Get the current rollback stack */
  getRollbackStack(): FileChange[] {
    return [...this.rollbackStack];
  }

  // ─── Private: Step Execution ───────────────────────────────

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
    // Try local cache first, then fetch from remote
    let content = allFiles.get(step.target);

    if (!content) {
      content = await this.toolBridge.readFile(step.target, options.branch);
      allFiles.set(step.target, content);
    }

    step.result = `Read ${content.length} characters from ${step.target}`;
    return null; // Read doesn't produce a change
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

    return null; // Analyze doesn't produce a change
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
        newContent: oldContent, // No actual change in dry run
        timestamp: Date.now(),
      };
    }

    // The actual edit content will be determined by the LLM agent
    // through the tool bridge. Here we record the change intent.
    // In a real execution, the agent provides old_str and new_str
    // through the OODAController which populates them.
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

  /** Check if a file path is protected */
  private isProtected(filePath: string, protectedPaths: string[]): boolean {
    return protectedPaths.some(p => filePath.startsWith(p) || filePath === p);
  }
}
