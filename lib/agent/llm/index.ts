/**
 * CodeForge IDE — LLM Module
 * Central barrel export for the LLM integration layer.
 *
 * Phase 6: Groq LLM Provider
 * - 14 models across 4 categories
 * - Chat + Streaming + OODA integration
 * - Model selector with Arabic UI
 */

// Types & Models
export type {
  ModelType,
  GroqModel,
  ModelGroup,
  ChatRole,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamDelta,
  StreamChunk,
  GroqConfig,
  OODAAnalysisRequest,
  OODAAnalysisResponse,
} from './types';

export {
  GROQ_MODELS,
  MODEL_GROUPS,
  getModelById,
  getTextModels,
  getRecommendedModels,
  getDefaultModel,
} from './types';

// Groq Provider
export {
  GroqProvider,
  getGroqProvider,
  resetGroqProvider,
} from './groq-provider';
