/**
 * CodeForge IDE — Agent Constants
 */

/** localStorage key for persisting agent configuration */
export const AGENT_CONFIG_KEY = 'codeforge-agent-config';

/** Maximum number of messages to keep in conversation history */
export const MAX_HISTORY_MESSAGES = 50;

/** Maximum number of tool call iterations per message */
export const MAX_TOOL_ITERATIONS = 10;

/** Default temperature for LLM calls */
export const DEFAULT_TEMPERATURE = 0.3;

/** Default max tokens for LLM responses */
export const DEFAULT_MAX_TOKENS = 4096;

/** Timeout for tool execution (ms) */
export const TOOL_EXECUTION_TIMEOUT = 30000;

/** Supported providers */
export const SUPPORTED_PROVIDERS = ['openai', 'google', 'groq', 'anthropic'] as const;

/** Provider display names */
export const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  google: 'Google (Gemini)',
  groq: 'Groq',
  anthropic: 'Anthropic',
};

/** Default models per provider */
export const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o',
  google: 'gemini-2.0-flash',
  groq: 'llama-3.3-70b-versatile',
  anthropic: 'claude-sonnet-4-20250514',
};

/** Available models per provider */
export const AVAILABLE_MODELS: Record<string, Array<{ id: string; name: string; free?: boolean }>> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4.1', name: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  ],
  google: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', free: true },
    { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', free: true },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', free: true },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', free: true },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', free: true },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', free: true },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    { id: 'claude-haiku-3.5-20241022', name: 'Claude Haiku 3.5' },
  ],
};
