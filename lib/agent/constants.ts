/**
 * CodeForge IDE — Agent Constants
 * Shared constants for the agent system.
 */

// Storage keys
export const AGENT_CONFIG_KEY = 'codeforge-agent-config';
export const AGENT_HISTORY_KEY = 'codeforge-agent-history';

// Limits
export const MAX_TOOL_ITERATIONS = 10;
export const MAX_HISTORY_MESSAGES = 50;
export const MAX_CONTEXT_FILES = 20;

// Timeouts
export const TOOL_EXECUTION_TIMEOUT = 30_000; // 30 seconds
export const API_REQUEST_TIMEOUT = 60_000; // 60 seconds

// UI
export const AGENT_PANEL_WIDTH = 380;
export const AGENT_PANEL_MIN_WIDTH = 300;
export const AGENT_PANEL_MAX_WIDTH = 600;

// Risk level colors (Catppuccin Mocha)
export const RISK_COLORS = {
  auto: '#a6e3a1',   // Green
  notify: '#f9e2af', // Yellow
  confirm: '#f38ba8', // Red
} as const;

// Tool categories
export const TOOL_CATEGORIES = {
  filesystem: {
    label: 'نظام الملفات',
    labelEn: 'File System',
    icon: 'file-code',
  },
  git: {
    label: 'Git & GitHub',
    labelEn: 'Git & GitHub',
    icon: 'git-branch',
  },
  utility: {
    label: 'أدوات مساعدة',
    labelEn: 'Utilities',
    icon: 'lightbulb',
  },
} as const;
