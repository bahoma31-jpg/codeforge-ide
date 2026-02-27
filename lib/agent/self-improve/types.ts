/**
 * CodeForge IDE — Self-Improvement Types
 * All TypeScript interfaces for the self-improving agent system.
 * Part of Phase 1: Foundation.
 */

import type { RiskLevel, ToolCallResult, FileDiff } from '../types';

// ─── OODA Loop Types ──────────────────────────────────────────

/** Trigger source for a self-improvement task */
export type TaskTrigger = 'user_report' | 'self_detected' | 'scheduled';

/** Category of the issue being addressed */
export type IssueCategory =
  | 'ui_bug'
  | 'logic_error'
  | 'performance'
  | 'style'
  | 'accessibility'
  | 'feature_enhancement';

/** Status of a self-improvement task */
export type TaskStatus =
  | 'observing'
  | 'orienting'
  | 'deciding'
  | 'acting'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** A single step in the fix plan */
export interface FixStep {
  order: number;
  action: 'read' | 'analyze' | 'edit' | 'create' | 'delete' | 'verify';
  target: string; // file path
  description: string;
  completed: boolean;
  result?: string;
}

/** Result of a verification check */
export interface VerificationCheck {
  name: string;
  passed: boolean;
  details: string;
}

/** Result of the verification phase */
export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  retryNeeded: boolean;
  reason?: string;
}

/** Record of a file change made during self-improvement */
export interface FileChange {
  filePath: string;
  changeType: 'create' | 'modify' | 'delete';
  oldContent?: string;
  newContent?: string;
  diff?: FileDiff;
  timestamp: number;
}

// ─── Main Self-Improvement Task ───────────────────────────────

/** Complete self-improvement task with all OODA phases */
export interface SelfImprovementTask {
  id: string;
  trigger: TaskTrigger;
  description: string;
  category: IssueCategory;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;

  /** Phase 1: Observation — what was detected */
  observation: {
    userMessage: string;
    affectedArea: string;
    detectedFiles: string[];
    evidence: string[];
  };

  /** Phase 2: Orientation — analysis of the problem */
  orientation: {
    rootCause: string;
    scope: string[];
    constraints: string[];
    skills: string[];
    standards: string[];
    relatedComponents: string[];
  };

  /** Phase 3: Decision — the fix plan */
  decision: {
    plan: FixStep[];
    riskLevel: RiskLevel;
    rollbackPlan: string;
    estimatedImpact: string;
    requiresApproval: boolean;
  };

  /** Phase 4 & 5: Execution and Verification */
  execution: {
    status: 'pending' | 'in_progress' | 'verifying' | 'completed' | 'failed';
    changes: FileChange[];
    verificationResult?: VerificationResult;
    iterations: number;
    maxIterations: number;
    errors: string[];
  };
}

// ─── Project Analysis Types ───────────────────────────────────

/** A node in the project dependency graph */
export interface DependencyNode {
  filePath: string;
  imports: string[];
  exportedSymbols: string[];
  importedBy: string[];
  language: string;
  size: number;
  lastModified?: number;
}

/** Map of the entire project structure */
export interface ProjectMap {
  rootPath: string;
  totalFiles: number;
  totalFolders: number;
  filesByExtension: Record<string, number>;
  dependencyGraph: Record<string, DependencyNode>;
  entryPoints: string[];
  configFiles: string[];
  componentFiles: string[];
  buildTimestamp: number;
}

/** Result of analyzing a single component */
export interface ComponentAnalysis {
  filePath: string;
  componentName: string;
  type: 'react_component' | 'hook' | 'utility' | 'store' | 'service' | 'type_definition' | 'config' | 'style' | 'test' | 'unknown';
  imports: Array<{ source: string; symbols: string[] }>;
  exports: string[];
  dependencies: string[];
  dependents: string[];
  props?: string[];
  stateUsage?: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  lineCount: number;
  hasTests: boolean;
}

/** Result of tracing dependencies */
export interface DependencyTrace {
  rootFile: string;
  depth: number;
  upstream: string[];   // files that this file imports from
  downstream: string[]; // files that import this file
  circularDeps: string[];
  traceTree: DependencyTreeNode;
}

/** Tree node for dependency visualization */
export interface DependencyTreeNode {
  filePath: string;
  children: DependencyTreeNode[];
  depth: number;
  isCircular: boolean;
}

// ─── Learning Memory Types ────────────────────────────────────

/** A recorded fix pattern for future reference */
export interface FixPattern {
  id: string;
  problemSignature: string;
  category: IssueCategory;
  solution: string;
  filesInvolved: string[];
  successRate: number;
  timesUsed: number;
  lastUsed: number;
  createdAt: number;
}

/** Summary of self-improvement activity */
export interface SelfImproveStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageIterations: number;
  mostModifiedFiles: Array<{ path: string; count: number }>;
  commonCategories: Array<{ category: IssueCategory; count: number }>;
}
