/**
 * CodeForge IDE — Risk Classifier
 * Classifies tool calls by risk level and checks for sensitive files.
 */

import type { ToolCall, ToolDefinition, RiskLevel } from '../types';

/** Files that require extra confirmation before modification */
const SENSITIVE_FILES = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'tsconfig.json',
  '.env',
  '.env.local',
  '.env.production',
  '.gitignore',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'vercel.json',
  'tailwind.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'postcss.config.mjs',
];

/** Patterns that indicate destructive operations */
const DESTRUCTIVE_PATTERNS = [
  'delete',
  'remove',
  'drop',
  'truncate',
  'reset',
  'force',
  'push',
];

/**
 * Classify the risk level of a tool call
 */
export function classifyRisk(
  toolCall: ToolCall,
  toolDef?: ToolDefinition
): RiskLevel {
  // Use tool definition's risk level as baseline
  const baseRisk = toolDef?.riskLevel || 'notify';

  // Check if the operation involves sensitive files
  const filePath = (toolCall.arguments?.filePath as string) || (toolCall.arguments?.path as string) || '';
  const isSensitiveFile = SENSITIVE_FILES.some(
    (sf) => filePath.endsWith(sf) || filePath.includes(sf)
  );

  // Escalate risk if sensitive file
  if (isSensitiveFile && baseRisk !== 'confirm') {
    return 'confirm';
  }

  // Check for destructive patterns in tool name
  const isDestructive = DESTRUCTIVE_PATTERNS.some(
    (p) => toolCall.name.toLowerCase().includes(p)
  );

  if (isDestructive && baseRisk === 'auto') {
    return 'notify';
  }

  return baseRisk;
}

/**
 * Check if a file path is sensitive
 */
export function isSensitiveFile(filePath: string): boolean {
  return SENSITIVE_FILES.some(
    (sf) => filePath.endsWith(sf) || filePath.includes(sf)
  );
}

/**
 * Get human-readable risk description
 */
export function getRiskDescription(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'auto':
      return 'عملية آمنة — تنفيذ تلقائي';
    case 'notify':
      return 'عملية متوسطة — سيتم إشعارك';
    case 'confirm':
      return 'عملية حساسة — تحتاج تأكيدك';
    default:
      return 'مستوى خطر غير معروف';
  }
}
