/**
 * CodeForge IDE — Tools Registry v2.3
 * Central registry for all agent tools.
 * Exports tool definitions and executor registration.
 *
 * v2.3 — Added OODA Phase 3 tools (5 active ooda_* tools):
 *   - fileTools:        9 tools (fs_* prefix)
 *   - gitTools:         8 tools (git_* prefix)
 *   - githubTools:      25 tools (github_* prefix)
 *   - utilityTools:     3 tools (get_project_context, explain_code, suggest_fix)
 *   - selfImproveTools: 8 tools (self_* prefix)
 *     Phase 1 (🟢 AUTO): self_analyze_component, self_trace_dependency, self_map_project
 *     Phase 2 (mixed):   self_start_improvement, self_get_task_status,
 *                         self_cancel_task, self_get_suggestions, self_get_stats
 *   - oodaTools:         5 tools (ooda_* prefix) ← NEW
 *     Phase 3: ooda_start_cycle, ooda_execute_fix, ooda_verify_fix,
 *              ooda_learn_pattern, ooda_get_status
 *   Total: 58 tools (6 categories)
 */

import type { ToolDefinition, ToolCategory } from '../types';
import type { AgentService } from '../agent-service';
import { fileTools, registerFileExecutors } from './file-tools';
import { gitTools, registerGitExecutors } from './git-tools';
import { githubTools, registerGitHubExecutors } from './github-tools';
import { utilityTools, registerUtilityExecutors } from './utility-tools';
import {
  selfImproveTools,
  registerSelfImproveExecutors,
} from '../self-improve';
import {
  oodaPhase3ToolDefinitions,
  registerOODAPhase3Executors,
} from '../self-improve';

/** OODA Phase 3 tools (category: 'ooda') */
const oodaTools: ToolDefinition[] = oodaPhase3ToolDefinitions;

/**
 * Get all available tools (58 total)
 */
export function getAllTools(): ToolDefinition[] {
  return [
    ...fileTools,
    ...gitTools,
    ...githubTools,
    ...utilityTools,
    ...selfImproveTools,
    ...oodaTools,
  ];
}

/**
 * All tools array (alias for backward compatibility)
 */
export const allTools: ToolDefinition[] = [
  ...fileTools,
  ...gitTools,
  ...githubTools,
  ...utilityTools,
  ...selfImproveTools,
  ...oodaTools,
];

/**
 * Register all tool executors with the agent service
 */
export function registerAllExecutors(service: AgentService): void {
  registerFileExecutors(service);
  registerGitExecutors(service);
  registerGitHubExecutors(service);
  registerUtilityExecutors(service);
  registerSelfImproveExecutors(service);
  registerOODAPhase3Executors(service);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return getAllTools().filter((t) => t.category === category);
}

/**
 * Get tool by name
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return getAllTools().find((t) => t.name === name);
}

/**
 * Get tools by risk level
 */
export function getToolsByRiskLevel(
  riskLevel: 'auto' | 'notify' | 'confirm'
): ToolDefinition[] {
  return getAllTools().filter((t) => t.riskLevel === riskLevel);
}

/**
 * Tool statistics — useful for debugging and audit
 */
export function getToolStats(): {
  total: number;
  byCategory: Record<string, number>;
  byRiskLevel: Record<string, number>;
} {
  const all = getAllTools();
  const byCategory: Record<string, number> = {};
  const byRiskLevel: Record<string, number> = {};

  for (const tool of all) {
    byCategory[tool.category] = (byCategory[tool.category] || 0) + 1;
    byRiskLevel[tool.riskLevel] = (byRiskLevel[tool.riskLevel] || 0) + 1;
  }

  return { total: all.length, byCategory, byRiskLevel };
}
