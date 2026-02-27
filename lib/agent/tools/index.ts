/**
 * CodeForge IDE — Tools Registry v2.1
 * Central registry for all agent tools.
 * Exports tool definitions and executor registration.
 *
 * v2.1 — Added self-improvement tools:
 *   - fileTools: 9 tools (fs_* prefix)
 *   - gitTools: 8 tools (git_* prefix)
 *   - githubTools: 25 tools (github_* prefix)
 *   - utilityTools: 3 tools (get_project_context, explain_code, suggest_fix)
 *   - selfImproveTools: 3 tools (self_analyze_component, self_trace_dependency, self_map_project)
 *   Total: 48 tools
 */

import type { ToolDefinition } from '../types';
import type { AgentService } from '../agent-service';
import { fileTools, registerFileExecutors } from './file-tools';
import { gitTools, registerGitExecutors } from './git-tools';
import { githubTools, registerGitHubExecutors } from './github-tools';
import { utilityTools, registerUtilityExecutors } from './utility-tools';
import { selfImproveTools, registerSelfImproveExecutors } from '../self-improve';

/**
 * Get all available tools (48 total)
 */
export function getAllTools(): ToolDefinition[] {
  return [
    ...fileTools,
    ...gitTools,
    ...githubTools,
    ...utilityTools,
    ...selfImproveTools,
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
}

/**
 * Get tools by category
 */
export function getToolsByCategory(
  category: 'filesystem' | 'git' | 'github' | 'utility' | 'self-improve'
): ToolDefinition[] {
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
