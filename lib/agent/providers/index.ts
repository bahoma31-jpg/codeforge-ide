/**
 * CodeForge IDE — Provider Factory
 * Creates and manages LLM provider instances.
 * Supports: OpenAI, Google Gemini, Groq, Anthropic.
 */

import type { ProviderId, ProviderConfig, AgentModel } from '../types';

// ─── Provider Configurations ──────────────────────────────────

const OPENAI_MODELS: AgentModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    contextWindow: 128000,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    contextWindow: 1047576,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    contextWindow: 1047576,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
];

const GOOGLE_MODELS: AgentModel[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    contextWindow: 1048576,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    contextWindow: 1048576,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    contextWindow: 2097152,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
];

const GROQ_MODELS: AgentModel[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    contextWindow: 131072,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    contextWindow: 32768,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    contextWindow: 131072,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
];

const ANTHROPIC_MODELS: AgentModel[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    contextWindow: 200000,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    contextWindow: 200000,
    supportsToolCalling: true,
    supportsStreaming: true,
  },
];

// ─── Provider Registry ───────────────────────────────────────

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o و GPT-4.1 — الأقوى في تنفيذ الأدوات',
    models: OPENAI_MODELS,
    apiKeyPlaceholder: 'sk-...',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    description: 'Gemini 2.0 — سياق طويل ومجاني جزئياً',
    models: GOOGLE_MODELS,
    apiKeyPlaceholder: 'AIza...',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    description: 'Llama و Mixtral — مجاني وسريع جداً',
    models: GROQ_MODELS,
    apiKeyPlaceholder: 'gsk_...',
    apiKeyUrl: 'https://console.groq.com/keys',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude — الأفضل في فهم وكتابة الكود',
    models: ANTHROPIC_MODELS,
    apiKeyPlaceholder: 'sk-ant-...',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
  },
};

/**
 * Get all available providers
 */
export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDERS);
}

/**
 * Get provider by ID
 */
export function getProvider(id: ProviderId): ProviderConfig {
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return provider;
}

/**
 * Get models for a provider
 */
export function getModels(providerId: ProviderId): AgentModel[] {
  return getProvider(providerId).models;
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(providerId: ProviderId): AgentModel {
  const models = getModels(providerId);
  return models[0];
}

/**
 * Validate API key format (basic check)
 * NOTE: We keep validation lenient because providers change key formats.
 * The real validation happens when the API call is made.
 */
export function validateApiKeyFormat(providerId: ProviderId, apiKey: string): boolean {
  if (!apiKey || apiKey.trim().length === 0) return false;

  const key = apiKey.trim();

  switch (providerId) {
    case 'openai':
      // OpenAI keys: sk-... or sk-proj-... or sess-... (formats change)
      return key.length > 20;
    case 'google':
      // Google AI Studio keys: AIza... (39 chars typically)
      return key.length > 20;
    case 'groq':
      // Groq keys: gsk_... but format has changed, some keys don't have prefix
      return key.length > 20;
    case 'anthropic':
      // Anthropic keys: sk-ant-...
      return key.length > 20;
    default:
      return key.length > 10;
  }
}
