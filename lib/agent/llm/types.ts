/**
 * CodeForge IDE — LLM Types & Model Registry
 * Defines all available Groq models with metadata.
 *
 * 14 models across 4 categories:
 * - Text Generation (9): Chat & code completion
 * - Compound AI (2): Multi-step reasoning
 * - Audio STT (2): Speech-to-text
 * - Audio TTS (1): Text-to-speech (Arabic)
 */

// ─── Model Types ─────────────────────────────────────────────

export type ModelType = 'text' | 'compound' | 'stt' | 'tts';

export interface GroqModel {
  id: string;
  name: string;
  nameAr: string;
  type: ModelType;
  contextWindow: number;
  maxOutputTokens: number;
  description: string;
  descriptionAr: string;
  speed: 'instant' | 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'low';
  recommended?: boolean;
}

export interface ModelGroup {
  type: ModelType;
  label: string;
  labelAr: string;
  icon: string;
  models: GroqModel[];
}

// ─── Chat Message Types ──────────────────────────────────────

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string[];
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'tool_calls' | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamDelta {
  role?: ChatRole;
  content?: string;
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: StreamDelta;
    finish_reason: 'stop' | 'length' | null;
  }>;
}

// ─── Provider Config ─────────────────────────────────────────

export interface GroqConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  temperature?: number;
  maxTokens?: number;
}

// ─── OODA Integration Types ──────────────────────────────────

export interface OODAAnalysisRequest {
  phase: 'observe' | 'orient' | 'decide';
  issue: string;
  fileContents: Record<string, string>;
  context?: string;
}

export interface OODAAnalysisResponse {
  analysis: string;
  suggestions: string[];
  fixes?: Array<{
    filePath: string;
    type: 'edit' | 'rewrite';
    oldStr?: string;
    newStr?: string;
    content?: string;
    explanation: string;
  }>;
  confidence: number;
}

// ─── All Available Groq Models ───────────────────────────────

export const GROQ_MODELS: GroqModel[] = [
  // ═══ Text Generation Models ═══════════════════════════════
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    nameAr: 'لاما 3.1 — 8B سريع',
    type: 'text',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    description: 'Fast & lightweight. Great for quick tasks and prototyping.',
    descriptionAr: 'سريع وخفيف. مثالي للمهام السريعة والتجريب.',
    speed: 'instant',
    quality: 'medium',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    nameAr: 'لاما 3.3 — 70B متعدد المهام',
    type: 'text',
    contextWindow: 131072,
    maxOutputTokens: 32768,
    description: 'Balanced power & speed. Best all-around model for coding.',
    descriptionAr: 'توازن بين القوة والسرعة. أفضل نموذج شامل للبرمجة.',
    speed: 'fast',
    quality: 'high',
    recommended: true,
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    nameAr: 'لاما 4 سكاوت — 17B',
    type: 'text',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    description: 'Next-gen Llama 4 with 16 experts. Excellent for analysis.',
    descriptionAr: 'الجيل الجديد لاما 4 مع 16 خبيرًا. ممتاز للتحليل.',
    speed: 'fast',
    quality: 'high',
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B',
    nameAr: 'لاما 4 مافريك — 17B',
    type: 'text',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    description: 'Llama 4 with 128 experts MoE. Top-tier for complex code tasks.',
    descriptionAr: 'لاما 4 مع 128 خبيرًا. الأفضل للمهام البرمجية المعقدة.',
    speed: 'medium',
    quality: 'high',
    recommended: true,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    nameAr: 'GPT مفتوح المصدر — 120B',
    type: 'text',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    description: 'OpenAI open-source 120B. Very powerful for deep reasoning.',
    descriptionAr: 'نموذج OpenAI مفتوح المصدر 120B. قوي جداً للتحليل العميق.',
    speed: 'slow',
    quality: 'high',
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    nameAr: 'GPT مفتوح المصدر — 20B',
    type: 'text',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    description: 'Lighter OpenAI model. Good balance of speed and capability.',
    descriptionAr: 'نموذج OpenAI خفيف. توازن جيد بين السرعة والقدرة.',
    speed: 'fast',
    quality: 'medium',
  },
  {
    id: 'openai/gpt-oss-safeguard-20b',
    name: 'GPT OSS Safeguard 20B',
    nameAr: 'GPT حماية — 20B',
    type: 'text',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    description: 'Safety-focused model. Good for content moderation tasks.',
    descriptionAr: 'نموذج يركز على السلامة. مناسب لمهام مراجعة المحتوى.',
    speed: 'fast',
    quality: 'medium',
  },
  {
    id: 'qwen/qwen3-32b',
    name: 'Qwen 3 32B',
    nameAr: 'كوين 3 — 32B',
    type: 'text',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    description: 'Alibaba Qwen3. Strong multilingual & coding capabilities.',
    descriptionAr: 'نموذج Qwen3 من علي بابا. قوي في اللغات المتعددة والبرمجة.',
    speed: 'fast',
    quality: 'high',
  },
  {
    id: 'moonshotai/kimi-k2-instruct-0905',
    name: 'Kimi K2 Instruct',
    nameAr: 'كيمي K2',
    type: 'text',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    description: 'Moonshot AI Kimi. Excellent instruction following.',
    descriptionAr: 'نموذج كيمي من Moonshot. ممتاز في اتباع التعليمات.',
    speed: 'fast',
    quality: 'high',
  },

  // ═══ Compound AI Models ════════════════════════════════════
  {
    id: 'groq/compound',
    name: 'Groq Compound',
    nameAr: 'جروك مركب',
    type: 'compound',
    contextWindow: 131072,
    maxOutputTokens: 32768,
    description: 'Multi-step reasoning with tool use. Best for complex workflows.',
    descriptionAr: 'تفكير متعدد الخطوات مع استخدام أدوات. الأفضل لسير العمل المعقد.',
    speed: 'medium',
    quality: 'high',
    recommended: true,
  },
  {
    id: 'groq/compound-mini',
    name: 'Groq Compound Mini',
    nameAr: 'جروك مركب صغير',
    type: 'compound',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    description: 'Lightweight compound model. Faster multi-step reasoning.',
    descriptionAr: 'نموذج مركب خفيف. تفكير متعدد الخطوات أسرع.',
    speed: 'fast',
    quality: 'medium',
  },

  // ═══ Audio: Speech-to-Text ═════════════════════════════════
  {
    id: 'whisper-large-v3',
    name: 'Whisper Large V3',
    nameAr: 'ويسبر كبير V3',
    type: 'stt',
    contextWindow: 0,
    maxOutputTokens: 0,
    description: 'OpenAI Whisper. High-accuracy speech-to-text in 99 languages.',
    descriptionAr: 'ويسبر من OpenAI. تحويل صوت لنص بدقة عالية في 99 لغة.',
    speed: 'medium',
    quality: 'high',
  },
  {
    id: 'whisper-large-v3-turbo',
    name: 'Whisper Large V3 Turbo',
    nameAr: 'ويسبر كبير V3 توربو',
    type: 'stt',
    contextWindow: 0,
    maxOutputTokens: 0,
    description: 'Faster Whisper variant. Slightly lower accuracy, much faster.',
    descriptionAr: 'نسخة أسرع من ويسبر. دقة أقل قليلاً، أسرع بكثير.',
    speed: 'fast',
    quality: 'medium',
  },

  // ═══ Audio: Text-to-Speech ═════════════════════════════════
  {
    id: 'canopylabs/orpheus-arabic-saudi',
    name: 'Orpheus Arabic Saudi',
    nameAr: 'أورفيوس عربي سعودي',
    type: 'tts',
    contextWindow: 0,
    maxOutputTokens: 0,
    description: 'Arabic TTS with Saudi dialect. Natural-sounding Arabic speech.',
    descriptionAr: 'تحويل نص لصوت باللهجة السعودية. نطق عربي طبيعي.',
    speed: 'fast',
    quality: 'high',
  },
];

// ─── Grouped Models ──────────────────────────────────────────

export const MODEL_GROUPS: ModelGroup[] = [
  {
    type: 'text',
    label: 'Text Generation',
    labelAr: '🧠 توليد النصوص',
    icon: '🧠',
    models: GROQ_MODELS.filter(m => m.type === 'text'),
  },
  {
    type: 'compound',
    label: 'Compound AI',
    labelAr: '🔗 ذكاء مركب',
    icon: '🔗',
    models: GROQ_MODELS.filter(m => m.type === 'compound'),
  },
  {
    type: 'stt',
    label: 'Speech-to-Text',
    labelAr: '🎤 صوت → نص',
    icon: '🎤',
    models: GROQ_MODELS.filter(m => m.type === 'stt'),
  },
  {
    type: 'tts',
    label: 'Text-to-Speech',
    labelAr: '🔊 نص → صوت',
    icon: '🔊',
    models: GROQ_MODELS.filter(m => m.type === 'tts'),
  },
];

// ─── Helpers ─────────────────────────────────────────────────

export function getModelById(id: string): GroqModel | undefined {
  return GROQ_MODELS.find(m => m.id === id);
}

export function getTextModels(): GroqModel[] {
  return GROQ_MODELS.filter(m => m.type === 'text' || m.type === 'compound');
}

export function getRecommendedModels(): GroqModel[] {
  return GROQ_MODELS.filter(m => m.recommended);
}

export function getDefaultModel(): GroqModel {
  return GROQ_MODELS.find(m => m.id === 'llama-3.3-70b-versatile')!;
}
