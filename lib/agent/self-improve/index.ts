/**
 * CodeForge IDE — Self-Improvement Module
 * Central barrel export for all self-improvement components.
 *
 * Phase 1: Foundation (analysis + basic tools)
 * Phase 2: OODA Loop (controller + executor + verification + memory)
 * Phase 3: Active OODA Tools (ooda_* category tools + UI connector)
 */

// ─── Phase 1: Foundation ────────────────────────────────────────

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

// Phase 1 Tools (self_analyze_component, self_trace_dependency, self_map_project)
// + Phase 2 Tools (self_start_improvement, self_get_task_status, self_cancel_task, self_get_suggestions, self_get_stats)
export {
  selfImproveToolDefinitions,
  selfImproveTools,
  selfImproveToolExecutors,
  registerSelfImproveExecutors,
} from './self-improve-tools';

// ─── Phase 2: OODA Loop Engine ─────────────────────────────────

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

// OODA Tools (Phase 2 — exposed via self-improve category)
export {
  oodaToolDefinitions,
  createOODAToolExecutors,
} from './ooda-tools';

// ─── Phase 3: Active OODA Tools ────────────────────────────────

// OODA Phase 3 Tool Definitions + Executors (ooda_* category)
export {
  oodaPhase3ToolDefinitions,
  createOODAPhase3Executors,
  registerOODAPhase3Executors,
} from './ooda-tool-definitions';

// UI ↔ Engine Connector
export {
  SelfImproveConnector,
} from './self-improve-connector';
