/**
 * CodeForge IDE — Risk Classifier v2.0
 * Classifies tool calls by risk level.
 * Handles both local filesystem and GitHub API tool contexts.
 *
 * v2.0 — Added GitHub-specific sensitive paths, expanded destructive patterns,
 *         new classifyGitHubRisk() for remote operations.
 */

import type { ToolCall, ToolDefinition, RiskLevel } from '../types';

// ─── Sensitive File Patterns ──────────────────────────────────

/** Local files that require extra confirmation before modification */
const SENSITIVE_LOCAL_FILES = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'tsconfig.json',
  'tsconfig.base.json',
  '.env',
  '.env.local',
  '.env.production',
  '.env.staging',
  '.gitignore',
  '.gitattributes',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'vercel.json',
  'netlify.toml',
  'tailwind.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'postcss.config.mjs',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.dockerignore',
  'Makefile',
  'Procfile',
];

/** GitHub paths that are sensitive for remote operations */
const SENSITIVE_GITHUB_PATHS = [
  '.github/',
  '.github/workflows/',
  '.github/CODEOWNERS',
  '.github/dependabot.yml',
  'SECURITY.md',
  'LICENSE',
  'LICENSE.md',
  'CONTRIBUTING.md',
];

/** Combined sensitive patterns (used for universal checks) */
const ALL_SENSITIVE_PATTERNS = [
  ...SENSITIVE_LOCAL_FILES,
  ...SENSITIVE_GITHUB_PATHS,
];

// ─── Destructive Operation Patterns ───────────────────────────

/** Tool name patterns that indicate destructive operations */
const DESTRUCTIVE_PATTERNS = [
  'delete',
  'remove',
  'drop',
  'truncate',
  'reset',
  'force',
  'push',
  'merge',
  'destroy',
];

/** Patterns in arguments that suggest high-risk content */
const RISKY_CONTENT_PATTERNS = [
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /token/i,
  /credential/i,
  /private[_-]?key/i,
  /BEGIN\s+(RSA|DSA|EC|OPENSSH)\s+PRIVATE\s+KEY/,
];

// ─── Core Classification ──────────────────────────────────────

/**
 * Classify the risk level of a tool call.
 * Uses tool definition as baseline, then escalates based on context.
 */
export function classifyRisk(
  toolCall: ToolCall,
  toolDef?: ToolDefinition
): RiskLevel {
  // Use tool definition's risk level as baseline
  const baseRisk = toolDef?.riskLevel || 'notify';

  // Extract file path from various argument formats
  const filePath = extractFilePath(toolCall.arguments);

  // Check if the operation involves sensitive files
  const isSensitive = filePath ? isSensitiveFile(filePath) : false;

  // Escalate risk if sensitive file
  if (isSensitive && baseRisk !== 'confirm') {
    return 'confirm';
  }

  // Check for destructive patterns in tool name
  const isDestructive = DESTRUCTIVE_PATTERNS.some(
    (p) => toolCall.name.toLowerCase().includes(p)
  );

  if (isDestructive && baseRisk === 'auto') {
    return 'notify';
  }

  // Check for risky content in arguments (e.g., hardcoded secrets)
  if (baseRisk !== 'confirm' && containsRiskyContent(toolCall.arguments)) {
    return 'confirm';
  }

  return baseRisk;
}

/**
 * Classify risk specifically for GitHub API tool calls.
 * Adds GitHub-specific path sensitivity checks.
 */
export function classifyGitHubRisk(
  toolCall: ToolCall,
  toolDef?: ToolDefinition
): RiskLevel {
  const baseRisk = classifyRisk(toolCall, toolDef);

  // Additional GitHub-specific checks
  const filePath = extractFilePath(toolCall.arguments);
  if (filePath) {
    const isGitHubSensitive = SENSITIVE_GITHUB_PATHS.some(
      (sp) => filePath.startsWith(sp) || filePath === sp.replace(/\/$/, '')
    );
    if (isGitHubSensitive && baseRisk !== 'confirm') {
      return 'confirm';
    }
  }

  // Escalate github_push_files to confirm (multi-file atomic commits)
  if (toolCall.name === 'github_push_files' && baseRisk !== 'confirm') {
    return 'confirm';
  }

  return baseRisk;
}

// ─── Helper Functions ─────────────────────────────────────────

/**
 * Extract file path from tool arguments (handles multiple field names)
 */
function extractFilePath(args: Record<string, unknown>): string {
  return (
    (args.filePath as string) ||
    (args.path as string) ||
    (args.file as string) ||
    (args.name as string) ||
    ''
  );
}

/**
 * Check if a file path is sensitive (local or GitHub)
 */
export function isSensitiveFile(filePath: string): boolean {
  return ALL_SENSITIVE_PATTERNS.some(
    (sf) => filePath.endsWith(sf) || filePath.includes(sf) || filePath.startsWith(sf)
  );
}

/**
 * Check if tool arguments contain potentially risky content (secrets, keys)
 */
export function containsRiskyContent(args: Record<string, unknown>): boolean {
  const content = (args.content as string) || (args.newContent as string) || '';
  if (!content) return false;

  return RISKY_CONTENT_PATTERNS.some((pattern) => pattern.test(content));
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

/**
 * Get risk level emoji for UI display
 */
export function getRiskEmoji(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'auto': return '🟢';
    case 'notify': return '🟡';
    case 'confirm': return '🔴';
    default: return '⚪';
  }
}
