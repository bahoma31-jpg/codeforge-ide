/**
 * CodeForge IDE — Safety Module v2.0
 * Central export for all safety components.
 *
 * Provides processToolSafety() as the single entry point
 * for the agent-service tool execution loop.
 */

import type { ToolCall, ToolDefinition, RiskLevel } from '../types';
import {
  classifyRisk,
  classifyGitHubRisk,
  isSensitiveFile,
  containsRiskyContent,
  getRiskDescription,
  getRiskEmoji,
} from './risk-classifier';
import { ApprovalManager, type ToolNotification } from './approval-manager';
import type { PendingApproval } from '../types';

// Re-export everything
export {
  classifyRisk,
  classifyGitHubRisk,
  isSensitiveFile,
  containsRiskyContent,
  getRiskDescription,
  getRiskEmoji,
} from './risk-classifier';
export { ApprovalManager, type ToolNotification } from './approval-manager';

// ─── Singleton Approval Manager ───────────────────────────────

let _approvalManager: ApprovalManager | null = null;

export function getApprovalManager(): ApprovalManager {
  if (!_approvalManager) {
    _approvalManager = new ApprovalManager();
  }
  return _approvalManager;
}

// ─── Safety Action Descriptors ────────────────────────────────

export type SafetyAction =
  | { type: 'auto'; riskLevel: 'auto' }
  | { type: 'notify'; riskLevel: 'notify'; notification: ToolNotification }
  | { type: 'confirm'; riskLevel: 'confirm'; approval: PendingApproval };

/**
 * processToolSafety — Single entry point for the agent-service.
 *
 * Given a tool call and its definition, returns a SafetyAction
 * that tells the agent-service exactly what to do:
 *
 * - auto:    Execute immediately, no UI interaction
 * - notify:  Execute but show a notification to the user
 * - confirm: Pause and wait for user approval before executing
 *
 * Usage in agent-service:
 * ```ts
 * const action = processToolSafety(toolCall, toolDef);
 * if (action.type === 'confirm') {
 *   const approved = await onApprovalRequired(action.approval);
 *   if (!approved) { /* skip */ }
 * } else if (action.type === 'notify') {
 *   onNotify?.(action.notification);
 * }
 * // then execute the tool
 * ```
 */
export function processToolSafety(
  toolCall: ToolCall,
  toolDef?: ToolDefinition
): SafetyAction {
  const manager = getApprovalManager();

  // Determine effective risk level
  const effectiveRisk = manager.getEffectiveRisk(toolCall, toolDef);

  switch (effectiveRisk) {
    case 'confirm':
      return {
        type: 'confirm',
        riskLevel: 'confirm',
        approval: manager.createApproval(toolCall, toolDef),
      };

    case 'notify':
      return {
        type: 'notify',
        riskLevel: 'notify',
        notification: manager.createNotification(toolCall),
      };

    case 'auto':
    default:
      return {
        type: 'auto',
        riskLevel: 'auto',
      };
  }
}

/**
 * Quick check: does this tool call need any user interaction?
 * Returns false for AUTO tools, true for NOTIFY and CONFIRM.
 */
export function requiresUserInteraction(
  toolCall: ToolCall,
  toolDef?: ToolDefinition
): boolean {
  const manager = getApprovalManager();
  return !manager.isAutoExecute(toolCall, toolDef);
}

/**
 * Quick check: is this a dangerous (CONFIRM-level) operation?
 */
export function isDangerous(
  toolCall: ToolCall,
  toolDef?: ToolDefinition
): boolean {
  const manager = getApprovalManager();
  return manager.needsApproval(toolCall, toolDef);
}
