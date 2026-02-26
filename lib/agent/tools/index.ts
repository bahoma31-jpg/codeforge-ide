/**
 * CodeForge IDE — Tools Registry
 * Central registry for all agent tools.
 * Exports tool definitions and executor registration.
 */

import type { ToolDefinition } from '../types';
import type { AgentService } from '../agent-service';
import { fileTools, registerFileExecutors } from './file-tools';
import { gitTools, registerGitExecutors } from './git-tools';
import { utilityTools, registerUtilityExecutors } from './utility-tools';

/**
 * Get all available tools
 */
export function getAllTools(): ToolDefinition[] {
  return [
    ...fileTools,
    ...gitTools,
    ...utilityTools,
  ];
}

/**
 * Register all tool executors with the agent service
 */
export function registerAllExecutors(service: AgentService): void {
  registerFileExecutors(service);
  registerGitExecutors(service);
  registerUtilityExecutors(service);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: 'filesystem' | 'git' | 'utility'): ToolDefinition[] {
  return getAllTools().filter((t) => t.category === category);
}

/**
 * Get tool by name
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return getAllTools().find((t) => t.name === name);
}
