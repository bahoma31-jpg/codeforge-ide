/**
 * CodeForge IDE — Self-Improvement Module
 * Central export for all self-improvement functionality.
 *
 * Phase 1 includes:
 * - Type definitions for OODA loop, project analysis, and learning memory
 * - SelfAnalysisEngine for code analysis and dependency tracing
 * - Self-improvement tools (self_analyze_component, self_trace_dependency, self_map_project)
 */

// Types
export type {
  TaskTrigger,
  IssueCategory,
  TaskStatus,
  FixStep,
  VerificationCheck,
  VerificationResult,
  FileChange,
  SelfImprovementTask,
  DependencyNode,
  DependencyTrace,
  DependencyTreeNode,
  ProjectMap,
  ComponentAnalysis,
  FixPattern,
  SelfImproveStats,
} from './types';

// Engine
export { SelfAnalysisEngine, getSelfAnalysisEngine } from './self-analysis-engine';

// Tools
export { selfImproveTools, registerSelfImproveExecutors } from './self-improve-tools';
