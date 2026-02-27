/**
 * CodeForge IDE — OODA Controller
 * Orchestrates the full Self-Improvement loop:
 * Observe → Orient → Decide → Act → Verify
 *
 * This is the "conductor" that coordinates all self-improvement components.
 * Phase 2: OODA Loop Implementation.
 */

import { v4 as uuidv4 } from 'uuid';
import { getSelfAnalysisEngine } from './self-analysis-engine';
import { FixExecutor, type ToolBridge } from './fix-executor';
import { VerificationEngine } from './verification-engine';
import type {
  SelfImprovementTask,
  TaskTrigger,
  TaskStatus,
  IssueCategory,
  FixStep,
  FileChange,
  ComponentAnalysis,
  DependencyTrace,
  ProjectMap,
  VerificationResult,
} from './types';
import {
  SELF_IMPROVE_MAX_ITERATIONS,
  SELF_IMPROVE_MAX_FILES,
  SELF_IMPROVE_PROTECTED_PATHS,
} from '../constants';

// ─── Event Types ──────────────────────────────────────────────

export type OODAPhase = 'observe' | 'orient' | 'decide' | 'act' | 'verify';

export interface OODAEvent {
  taskId: string;
  phase: OODAPhase;
  status: 'started' | 'completed' | 'failed';
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export type OODAEventListener = (event: OODAEvent) => void;

// ─── OODA Controller ─────────────────────────────────────────

/**
 * OODAController — The main orchestrator for self-improvement tasks.
 *
 * Usage:
 * ```ts
 * const controller = new OODAController(toolBridge);
 * controller.onEvent((event) => console.log(event));
 * const task = await controller.startImprovement(
 *   'user_report',
 *   'The sidebar is not rendering correctly',
 *   allProjectFiles
 * );
 * ```
 */
export class OODAController {
  private activeTasks: Map<string, SelfImprovementTask> = new Map();
  private completedTasks: SelfImprovementTask[] = [];
  private eventListeners: OODAEventListener[] = [];
  private fixExecutor: FixExecutor;
  private verificationEngine: VerificationEngine;

  constructor(toolBridge: ToolBridge) {
    this.fixExecutor = new FixExecutor(toolBridge);
    this.verificationEngine = new VerificationEngine();
  }

  // ─── Public API ───────────────────────────────────────────

  /** Register an event listener for OODA phase transitions */
  onEvent(listener: OODAEventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  /** Start a new self-improvement task */
  async startImprovement(
    trigger: TaskTrigger,
    description: string,
    allFiles: Map<string, string>,
    options?: {
      category?: IssueCategory;
      onApprovalRequired?: (task: SelfImprovementTask) => Promise<boolean>;
    }
  ): Promise<SelfImprovementTask> {
    const task = this.createTask(trigger, description);
    this.activeTasks.set(task.id, task);

    try {
      // ═══ Phase 1: OBSERVE ═══
      await this.phaseObserve(task, allFiles);

      // ═══ Phase 2: ORIENT ═══
      await this.phaseOrient(task, allFiles);

      // Auto-detect category if not provided
      if (options?.category) {
        task.category = options.category;
      }

      // ═══ Phase 3: DECIDE ═══
      await this.phaseDecide(task, allFiles);

      // Check if approval is needed
      if (task.decision.requiresApproval && options?.onApprovalRequired) {
        const approved = await options.onApprovalRequired(task);
        if (!approved) {
          task.status = 'cancelled';
          task.updatedAt = Date.now();
          this.emit(task.id, 'decide', 'failed', 'Task cancelled by user — approval denied');
          this.finalizeTask(task);
          return task;
        }
      }

      // ═══ Phase 4 & 5: ACT + VERIFY (with retry loop) ═══
      await this.phaseActAndVerify(task, allFiles);

    } catch (error) {
      task.status = 'failed';
      task.execution.status = 'failed';
      task.execution.errors.push((error as Error).message);
      task.updatedAt = Date.now();
      this.emit(task.id, 'act', 'failed', `Task failed: ${(error as Error).message}`);
    }

    this.finalizeTask(task);
    return task;
  }

  /** Get the status of an active or completed task */
  getTask(taskId: string): SelfImprovementTask | undefined {
    return this.activeTasks.get(taskId) || this.completedTasks.find(t => t.id === taskId);
  }

  /** Get all active tasks */
  getActiveTasks(): SelfImprovementTask[] {
    return Array.from(this.activeTasks.values());
  }

  /** Get completed tasks history */
  getHistory(): SelfImprovementTask[] {
    return [...this.completedTasks];
  }

  /** Cancel an active task */
  cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (!task) return false;

    task.status = 'cancelled';
    task.updatedAt = Date.now();
    this.finalizeTask(task);
    this.emit(taskId, 'act', 'failed', 'Task cancelled by user');
    return true;
  }

  // ─── Phase 1: OBSERVE ─────────────────────────────────────

  private async phaseObserve(
    task: SelfImprovementTask,
    allFiles: Map<string, string>
  ): Promise<void> {
    task.status = 'observing';
    task.updatedAt = Date.now();
    this.emit(task.id, 'observe', 'started', 'Gathering evidence...');

    const engine = getSelfAnalysisEngine();

    // Step 1: Find related files using keyword matching
    const relatedFiles = engine.findRelatedFiles(
      task.observation.userMessage,
      allFiles,
      15
    );

    task.observation.detectedFiles = relatedFiles.map(f => f.filePath);

    // Step 2: Analyze the top related files
    const topFiles = relatedFiles.slice(0, 5);
    const analyses: ComponentAnalysis[] = [];

    for (const file of topFiles) {
      const content = allFiles.get(file.filePath);
      if (content) {
        const analysis = engine.analyzeComponent(file.filePath, content);
        analyses.push(analysis);
        task.observation.evidence.push(
          `${file.filePath}: type=${analysis.type}, complexity=${analysis.estimatedComplexity}, ` +
          `imports=${analysis.imports.length}, exports=${analysis.exports.length}, ` +
          `lines=${analysis.lineCount} (relevance: ${file.relevanceScore}, reason: ${file.reason})`
        );
      }
    }

    // Step 3: Determine affected area
    if (analyses.length > 0) {
      const types = [...new Set(analyses.map(a => a.type))];
      const areas = [...new Set(analyses.map(a => a.filePath.split('/').slice(0, -1).join('/')))];
      task.observation.affectedArea = `${types.join(', ')} in ${areas.join(', ')}`;
    } else {
      task.observation.affectedArea = 'unknown — no matching files found';
    }

    this.emit(task.id, 'observe', 'completed',
      `Found ${relatedFiles.length} related files, analyzed top ${topFiles.length}`,
      { fileCount: relatedFiles.length, analyses: analyses.length }
    );
  }

  // ─── Phase 2: ORIENT ──────────────────────────────────────

  private async phaseOrient(
    task: SelfImprovementTask,
    allFiles: Map<string, string>
  ): Promise<void> {
    task.status = 'orienting';
    task.updatedAt = Date.now();
    this.emit(task.id, 'orient', 'started', 'Analyzing root cause...');

    const engine = getSelfAnalysisEngine();
    const topFiles = task.observation.detectedFiles.slice(0, 5);

    // Step 1: Trace dependencies for each file
    const allTraces: DependencyTrace[] = [];
    const relatedComponents = new Set<string>();

    for (const filePath of topFiles) {
      const trace = engine.traceDependencies(filePath, allFiles, 3);
      allTraces.push(trace);

      // Collect related components
      trace.upstream.forEach(f => relatedComponents.add(f));
      trace.downstream.forEach(f => relatedComponents.add(f));
    }

    // Step 2: Determine scope
    const scope = new Set<string>(topFiles);
    for (const trace of allTraces) {
      // Include direct downstream dependents (they might break)
      trace.downstream.forEach(f => scope.add(f));
    }

    // Filter protected paths
    const filteredScope = Array.from(scope).filter(
      f => !SELF_IMPROVE_PROTECTED_PATHS.some(p => f.startsWith(p))
    );

    // Step 3: Determine skills needed
    const skills = new Set<string>();
    for (const filePath of filteredScope) {
      const content = allFiles.get(filePath);
      if (!content) continue;

      if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) skills.add('React');
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) skills.add('TypeScript');
      if (filePath.endsWith('.css') || filePath.endsWith('.scss')) skills.add('CSS');
      if (content.includes('zustand') || content.includes('create(')) skills.add('Zustand');
      if (content.includes('fetch(') || content.includes('axios')) skills.add('API Integration');
      if (content.includes('useEffect') || content.includes('useState')) skills.add('React Hooks');
    }

    // Step 4: Detect circular dependencies
    const circularDeps = allTraces.flatMap(t => t.circularDeps);
    const constraints = [
      ...SELF_IMPROVE_PROTECTED_PATHS.map(p => `Protected: ${p}`),
      `Max files: ${SELF_IMPROVE_MAX_FILES}`,
      `Max iterations: ${SELF_IMPROVE_MAX_ITERATIONS}`,
    ];
    if (circularDeps.length > 0) {
      constraints.push(`Circular deps detected: ${circularDeps.join(', ')}`);
    }

    // Step 5: Infer root cause
    const rootCause = this.inferRootCause(task, allFiles, topFiles);

    // Populate orientation
    task.orientation = {
      rootCause,
      scope: filteredScope,
      constraints,
      skills: Array.from(skills),
      standards: [
        'All imports/exports must remain valid',
        'No unrelated code modifications',
        'Match existing code style',
        'Meaningful commit messages',
      ],
      relatedComponents: Array.from(relatedComponents).slice(0, 20),
    };

    // Auto-detect category
    task.category = this.detectCategory(task);

    this.emit(task.id, 'orient', 'completed',
      `Root cause identified. Scope: ${filteredScope.length} files. Skills: ${Array.from(skills).join(', ')}`,
      { scope: filteredScope.length, skills: Array.from(skills) }
    );
  }

  // ─── Phase 3: DECIDE ──────────────────────────────────────

  private async phaseDecide(
    task: SelfImprovementTask,
    allFiles: Map<string, string>
  ): Promise<void> {
    task.status = 'deciding';
    task.updatedAt = Date.now();
    this.emit(task.id, 'decide', 'started', 'Creating fix plan...');

    const scope = task.orientation.scope;

    // Step 1: Create fix steps
    const plan: FixStep[] = [];
    let stepOrder = 1;

    // First: read all files in scope
    for (const filePath of scope) {
      plan.push({
        order: stepOrder++,
        action: 'read',
        target: filePath,
        description: `Read current state of ${filePath.split('/').pop()}`,
        completed: false,
      });
    }

    // Then: analyze dependencies
    plan.push({
      order: stepOrder++,
      action: 'analyze',
      target: scope[0] || '',
      description: 'Analyze dependency impact of planned changes',
      completed: false,
    });

    // Then: edit files (primary targets first)
    const primaryTargets = task.observation.detectedFiles.slice(0, 3);
    for (const filePath of primaryTargets) {
      if (SELF_IMPROVE_PROTECTED_PATHS.some(p => filePath.startsWith(p))) continue;

      plan.push({
        order: stepOrder++,
        action: 'edit',
        target: filePath,
        description: `Apply fix to ${filePath.split('/').pop()} — address: ${task.orientation.rootCause.substring(0, 80)}`,
        completed: false,
      });
    }

    // Finally: verify each change
    for (const filePath of primaryTargets) {
      plan.push({
        order: stepOrder++,
        action: 'verify',
        target: filePath,
        description: `Verify changes in ${filePath.split('/').pop()}`,
        completed: false,
      });
    }

    // Step 2: Assess risk
    const riskLevel = this.assessRisk(task, plan);

    // Step 3: Determine if approval is needed
    const requiresApproval =
      riskLevel === 'high' ||
      riskLevel === 'critical' ||
      primaryTargets.length >= 3;

    // Step 4: Create rollback plan
    const rollbackPlan = primaryTargets
      .map(f => `Revert ${f.split('/').pop()} to pre-edit state`)
      .join('; ');

    task.decision = {
      plan,
      riskLevel,
      rollbackPlan: rollbackPlan || 'No files modified — no rollback needed',
      estimatedImpact: `${primaryTargets.length} files directly modified, ` +
        `${task.orientation.relatedComponents.length} related components`,
      requiresApproval,
    };

    this.emit(task.id, 'decide', 'completed',
      `Plan created: ${plan.length} steps, risk=${riskLevel}, approval=${requiresApproval}`,
      { steps: plan.length, riskLevel, requiresApproval }
    );
  }

  // ─── Phase 4+5: ACT + VERIFY ──────────────────────────────

  private async phaseActAndVerify(
    task: SelfImprovementTask,
    allFiles: Map<string, string>
  ): Promise<void> {
    const maxIterations = task.execution.maxIterations;

    while (task.execution.iterations < maxIterations) {
      task.execution.iterations++;

      // ═══ ACT ═══
      task.status = 'acting';
      task.execution.status = 'in_progress';
      task.updatedAt = Date.now();
      this.emit(task.id, 'act', 'started',
        `Executing fix plan (iteration ${task.execution.iterations}/${maxIterations})...`
      );

      try {
        const changes = await this.fixExecutor.executePlan(
          task.decision.plan,
          allFiles,
          {
            protectedPaths: SELF_IMPROVE_PROTECTED_PATHS,
            maxFiles: SELF_IMPROVE_MAX_FILES,
            dryRun: false,
          }
        );

        task.execution.changes.push(...changes);

        // Update allFiles with changes for verification
        for (const change of changes) {
          if (change.changeType === 'modify' || change.changeType === 'create') {
            if (change.newContent) {
              allFiles.set(change.filePath, change.newContent);
            }
          } else if (change.changeType === 'delete') {
            allFiles.delete(change.filePath);
          }
        }

        this.emit(task.id, 'act', 'completed',
          `Applied ${changes.length} changes`,
          { changesCount: changes.length }
        );

      } catch (error) {
        task.execution.errors.push(`Act phase error: ${(error as Error).message}`);
        this.emit(task.id, 'act', 'failed', (error as Error).message);

        if (task.execution.iterations >= maxIterations) {
          task.status = 'failed';
          task.execution.status = 'failed';
          return;
        }
        continue;
      }

      // ═══ VERIFY ═══
      task.status = 'verifying';
      task.execution.status = 'verifying';
      task.updatedAt = Date.now();
      this.emit(task.id, 'verify', 'started', 'Verifying changes...');

      const verification = await this.verificationEngine.verify(
        task,
        allFiles,
        task.execution.changes
      );

      task.execution.verificationResult = verification;

      if (verification.passed) {
        // ✅ Success!
        task.status = 'completed';
        task.execution.status = 'completed';
        task.updatedAt = Date.now();
        this.emit(task.id, 'verify', 'completed', 'All checks passed! Task complete.', {
          checks: verification.checks.length,
          passed: verification.checks.filter(c => c.passed).length,
        });
        return;
      }

      // ❌ Verification failed — retry?
      this.emit(task.id, 'verify', 'failed',
        `Verification failed: ${verification.reason}. ` +
        `Retry ${task.execution.iterations}/${maxIterations}`,
        { reason: verification.reason }
      );

      if (!verification.retryNeeded || task.execution.iterations >= maxIterations) {
        task.status = 'failed';
        task.execution.status = 'failed';
        task.execution.errors.push(
          `Verification failed after ${task.execution.iterations} iterations: ${verification.reason}`
        );
        return;
      }

      // Loop back for another iteration
    }

    // Exhausted iterations
    task.status = 'failed';
    task.execution.status = 'failed';
    task.execution.errors.push(
      `Exhausted ${maxIterations} iterations without passing verification`
    );
  }

  // ─── Helper Methods ───────────────────────────────────────

  private createTask(trigger: TaskTrigger, description: string): SelfImprovementTask {
    const now = Date.now();
    return {
      id: uuidv4(),
      trigger,
      description,
      category: 'ui_bug', // Will be refined during orientation
      status: 'observing',
      createdAt: now,
      updatedAt: now,
      observation: {
        userMessage: description,
        affectedArea: '',
        detectedFiles: [],
        evidence: [],
      },
      orientation: {
        rootCause: '',
        scope: [],
        constraints: [],
        skills: [],
        standards: [],
        relatedComponents: [],
      },
      decision: {
        plan: [],
        riskLevel: 'low',
        rollbackPlan: '',
        estimatedImpact: '',
        requiresApproval: false,
      },
      execution: {
        status: 'pending',
        changes: [],
        iterations: 0,
        maxIterations: SELF_IMPROVE_MAX_ITERATIONS,
        errors: [],
      },
    };
  }

  /** Infer root cause from observation data */
  private inferRootCause(
    task: SelfImprovementTask,
    allFiles: Map<string, string>,
    topFiles: string[]
  ): string {
    const description = task.observation.userMessage.toLowerCase();
    const evidence = task.observation.evidence;

    // Pattern: style/CSS issue
    if (
      description.includes('style') || description.includes('css') ||
      description.includes('color') || description.includes('size') ||
      description.includes('position') || description.includes('layout') ||
      description.includes('لون') || description.includes('حجم') ||
      description.includes('واجهة')
    ) {
      const cssFiles = topFiles.filter(f => f.endsWith('.css') || f.endsWith('.scss'));
      if (cssFiles.length > 0) {
        return `CSS/Style issue in ${cssFiles.join(', ')} — layout or visual properties may need adjustment`;
      }
      return 'Style issue — CSS properties may need correction in component or module stylesheet';
    }

    // Pattern: component rendering
    if (
      description.includes('render') || description.includes('display') ||
      description.includes('show') || description.includes('appear') ||
      description.includes('يظهر') || description.includes('عرض')
    ) {
      return `Component rendering issue — conditional logic or state management in ${topFiles[0] || 'unknown'} may need fixing`;
    }

    // Pattern: functionality/logic
    if (
      description.includes('work') || description.includes('function') ||
      description.includes('click') || description.includes('button') ||
      description.includes('يعمل') || description.includes('زر')
    ) {
      return `Logic/functionality issue — event handler or state update in ${topFiles[0] || 'unknown'} may be broken`;
    }

    // Pattern: performance
    if (
      description.includes('slow') || description.includes('perf') ||
      description.includes('lag') || description.includes('بطيء')
    ) {
      return `Performance issue — potential unnecessary re-renders or heavy computation in ${topFiles[0] || 'unknown'}`;
    }

    // Default
    return `Issue detected in ${topFiles.slice(0, 3).join(', ')} — requires manual analysis of: ${description.substring(0, 100)}`;
  }

  /** Detect issue category from task data */
  private detectCategory(task: SelfImprovementTask): IssueCategory {
    const desc = task.observation.userMessage.toLowerCase();
    const rootCause = task.orientation.rootCause.toLowerCase();
    const combined = `${desc} ${rootCause}`;

    if (combined.includes('css') || combined.includes('style') || combined.includes('لون')) return 'style';
    if (combined.includes('slow') || combined.includes('perf') || combined.includes('بطيء')) return 'performance';
    if (combined.includes('access') || combined.includes('aria') || combined.includes('screen reader')) return 'accessibility';
    if (combined.includes('feature') || combined.includes('add') || combined.includes('إضافة')) return 'feature_enhancement';
    if (combined.includes('render') || combined.includes('display') || combined.includes('ui') || combined.includes('واجهة')) return 'ui_bug';
    return 'logic_error';
  }

  /** Assess risk level based on the fix plan */
  private assessRisk(
    task: SelfImprovementTask,
    plan: FixStep[]
  ): SelfImprovementTask['decision']['riskLevel'] {
    const editSteps = plan.filter(s => s.action === 'edit' || s.action === 'create' || s.action === 'delete');
    const scope = task.orientation.scope;

    // Critical: changing core services or many files
    if (
      editSteps.length > 5 ||
      scope.some(f => f.includes('agent-service') || f.includes('safety'))
    ) {
      return 'critical';
    }

    // High: multiple file edits or state management changes
    if (
      editSteps.length > 3 ||
      task.orientation.skills.includes('Zustand') ||
      scope.some(f => f.includes('store') || f.includes('provider'))
    ) {
      return 'high';
    }

    // Medium: 2-3 file edits
    if (editSteps.length >= 2) {
      return 'medium';
    }

    // Low: single file, likely CSS or text change
    return 'low';
  }

  /** Emit an event to all listeners */
  private emit(
    taskId: string,
    phase: OODAPhase,
    status: OODAEvent['status'],
    message: string,
    data?: Record<string, unknown>
  ): void {
    const event: OODAEvent = {
      taskId,
      phase,
      status,
      message,
      data,
      timestamp: Date.now(),
    };

    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch {
        // Don't let listener errors break the loop
      }
    }
  }

  /** Move task from active to completed */
  private finalizeTask(task: SelfImprovementTask): void {
    task.updatedAt = Date.now();
    this.activeTasks.delete(task.id);
    this.completedTasks.push(task);

    // Keep history bounded
    if (this.completedTasks.length > 50) {
      this.completedTasks = this.completedTasks.slice(-50);
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────

let controllerInstance: OODAController | null = null;

export function getOODAController(toolBridge: ToolBridge): OODAController {
  if (!controllerInstance) {
    controllerInstance = new OODAController(toolBridge);
  }
  return controllerInstance;
}
