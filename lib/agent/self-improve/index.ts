/**
 * CodeForge IDE — Self-Improvement Module
 * Central barrel export for all self-improvement components.
 *
 * Phase 1: Foundation (analysis + basic tools)
 * Phase 2: OODA Loop (controller + executor + verification + memory)
 */

// ─── Phase 1: Foundation ──────────────────────────────────────

// Types
export type {
  TaskTrigger,
  TaskStatus,
  IssueCategory,
  FixStep,
  VerificationCheck,
  VerificationResult,
  FileChange,
  SelfImprovementTask,
  DependencyNode,
  ProjectMap,
  ComponentAnalysis,
  DependencyTrace,
  DependencyTreeNode,
  FixPattern,
  SelfImproveStats,
} from './types';

// Self-Analysis Engine
export {
  SelfAnalysisEngine,
  getSelfAnalysisEngine,
} from './self-analysis-engine';

// Phase 1 Tools
export {
  selfImproveToolDefinitions,
  selfImproveToolExecutors,
} from './self-improve-tools';

// ─── Phase 2: OODA Loop ──────────────────────────────────────

// OODA Controller
export {
  OODAController,
  getOODAController,
} from './ooda-controller';
export type {
  OODAPhase,
  OODAEvent,
  OODAEventListener,
} from './ooda-controller';

// Fix Executor
export {
  FixExecutor,
} from './fix-executor';
export type {
  ToolBridge,
  ExecutionOptions,
} from './fix-executor';

// Verification Engine
export {
  VerificationEngine,
} from './verification-engine';

// Learning Memory
export {
  LearningMemory,
  getLearningMemory,
} from './learning-memory';

// OODA Tools
export {
  oodaToolDefinitions,
  createOODAToolExecutors,
} from './ooda-tools';
