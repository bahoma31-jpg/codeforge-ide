/**
 * CodeForge IDE — Risk Classifier
 * Classifies tool operations by risk level.
 * Provides additional safety checks beyond the static tool risk level.
 */

import type { ToolCall, ToolDefinition, RiskLevel } from '../types';

/**
 * Dangerous path patterns that should always require confirmation
 */
const DANGEROUS_PATHS = [
  /^\/?$/, // Root directory
  /package\.json$/,
  /tsconfig\.json$/,
  /\.env/,
  /\.gitignore$/,
  /next\.config/,
  /middleware\.ts$/,
];

/**
 * Classify the risk level of a tool call
 * May upgrade risk level based on context (e.g., modifying critical files)
 */
export function classifyRisk(
  toolCall: ToolCall,
  toolDef: ToolDefinition
): RiskLevel {
  const baseRisk = toolDef.riskLevel;

  // Never downgrade risk
  if (baseRisk === 'confirm') return 'confirm';

  // Check if operation targets dangerous paths
  const targetPath = extractTargetPath(toolCall);
  if (targetPath && isDangerousPath(targetPath)) {
    return 'confirm';
  }

  // Bulk operations are always risky
  if (isBulkOperation(toolCall)) {
    return baseRisk === 'auto' ? 'notify' : 'confirm';
  }

  return baseRisk;
}

/**
 * Check if a path matches dangerous patterns
 */
export function isDangerousPath(path: string): boolean {
  return DANGEROUS_PATHS.some((pattern) => pattern.test(path));
}

/**
 * Extract the target file path from tool call arguments
 */
function extractTargetPath(toolCall: ToolCall): string | null {
  const args = toolCall.args;
  if (typeof args.path === 'string') return args.path;
  if (typeof args.filePath === 'string') return args.filePath;
  if (typeof args.name === 'string') return args.name;
  return null;
}

/**
 * Check if tool call is a bulk operation
 */
function isBulkOperation(toolCall: ToolCall): boolean {
  const args = toolCall.args;

  // Staging all files
  if (
    toolCall.toolName === 'git_stage' &&
    Array.isArray(args.paths) &&
    (args.paths as string[]).includes('.')
  ) {
    return true;
  }

  return false;
}

/**
 * Get a human-readable description of the risk
 */
export function getRiskDescription(toolCall: ToolCall, riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'auto':
      return 'عملية آمنة — تنفيذ تلقائي';
    case 'notify':
      return `عملية عادية — ${toolCall.toolName}`;
    case 'confirm':
      return `⚠️ عملية خطيرة تتطلب تأكيدك — ${toolCall.toolName}`;
    default:
      return toolCall.toolName;
  }
}
