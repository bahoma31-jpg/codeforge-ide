/**
 * CodeForge IDE — Groq LLM Provider
 * Full Groq API client with chat, streaming, and OODA integration.
 *
 * Endpoints:
 * - Chat Completions: POST /openai/v1/chat/completions
 * - Audio Transcription: POST /openai/v1/audio/transcriptions
 *
 * Features:
 * - Standard chat completion
 * - Streaming responses (SSE)
 * - OODA phase analysis (observe, orient, decide)
 * - Automatic retry with exponential backoff
 * - Token usage tracking
 */

import type {
  GroqConfig,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamChunk,
  OODAAnalysisRequest,
  OODAAnalysisResponse,
} from './types';
import { getModelById, getDefaultModel } from './types';

// ─── Constants ───────────────────────────────────────────────

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ─── OODA System Prompts ─────────────────────────────────────

const OODA_SYSTEM_PROMPTS: Record<string, string> = {
  observe: `أنت محلل كود خبير في مشروع CodeForge IDE (Next.js + TypeScript + Monaco Editor).
مهمتك: **رصد** المشكلة وتحديد الملفات المتأثرة.

قواعد:
- حلل الكود المعطى بدقة
- حدد الملفات المتأثرة مباشرة وغير مباشرة
- اذكر الأدلة الواضحة على المشكلة
- لا تقترح حلولاً بعد — فقط رصد

أجب بصيغة JSON:
{
  "analysis": "وصف المشكلة",
  "suggestions": ["ملاحظة 1", "ملاحظة 2"],
  "confidence": 0.0-1.0
}`,

  orient: `أنت محلل كود خبير في مشروع CodeForge IDE.
مهمتك: **تحليل** السبب الجذري للمشكلة.

قواعد:
- حدد السبب الجذري (root cause)
- رتب الأسباب المحتملة حسب الاحتمالية
- حدد نطاق التأثير (scope)
- اذكر المهارات المطلوبة للإصلاح

أجب بصيغة JSON:
{
  "analysis": "السبب الجذري",
  "suggestions": ["سبب 1", "سبب 2"],
  "confidence": 0.0-1.0
}`,

  decide: `أنت مهندس برمجيات خبير في مشروع CodeForge IDE.
مهمتك: **اقتراح** خطة إصلاح دقيقة وقابلة للتنفيذ.

قواعد:
- اكتب التعديلات بدقة (oldStr → newStr أو content كامل)
- لا تعدل ملفات محمية (lib/agent/safety/*, .env*)
- حد أقصى 10 ملفات
- اشرح كل تعديل

أجب بصيغة JSON:
{
  "analysis": "خطة الإصلاح",
  "suggestions": ["خطوة 1", "خطوة 2"],
  "fixes": [
    {
      "filePath": "path/to/file.ts",
      "type": "edit",
      "oldStr": "الكود القديم",
      "newStr": "الكود الجديد",
      "explanation": "سبب التعديل"
    }
  ],
  "confidence": 0.0-1.0
}`,
};

// ─── GroqProvider Class ──────────────────────────────────────

export class GroqProvider {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private temperature: number;
  private maxTokens: number;

  // Usage tracking
  private totalPromptTokens = 0;
  private totalCompletionTokens = 0;
  private totalRequests = 0;

  constructor(config: GroqConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || GROQ_BASE_URL;
    this.defaultModel = config.defaultModel || getDefaultModel().id;
    this.temperature = config.temperature ?? 0.3;
    this.maxTokens = config.maxTokens ?? 8192;
  }

  // ─── Configuration ───────────────────────────────────────

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  setModel(modelId: string): void {
    const model = getModelById(modelId);
    if (model && (model.type === 'text' || model.type === 'compound')) {
      this.defaultModel = modelId;
    }
  }

  setTemperature(temp: number): void {
    this.temperature = Math.max(0, Math.min(2, temp));
  }

  getModel(): string {
    return this.defaultModel;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  // ─── Chat Completion ─────────────────────────────────────

  async chat(
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stop?: string[];
    }
  ): Promise<ChatCompletionResponse> {
    const request: ChatCompletionRequest = {
      model: options?.model || this.defaultModel,
      messages,
      temperature: options?.temperature ?? this.temperature,
      max_tokens: options?.maxTokens ?? this.maxTokens,
      stream: false,
      stop: options?.stop,
    };

    const response = await this.fetchWithRetry('/chat/completions', request);

    // Track usage
    if (response.usage) {
      this.totalPromptTokens += response.usage.prompt_tokens;
      this.totalCompletionTokens += response.usage.completion_tokens;
    }
    this.totalRequests++;

    return response;
  }

  // ─── Streaming Chat ──────────────────────────────────────

  async *chatStream(
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<string, void, unknown> {
    const request: ChatCompletionRequest = {
      model: options?.model || this.defaultModel,
      messages,
      temperature: options?.temperature ?? this.temperature,
      max_tokens: options?.maxTokens ?? this.maxTokens,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error (${response.status}): ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          try {
            const chunk: StreamChunk = JSON.parse(data);
            const content = chunk.choices[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    this.totalRequests++;
  }

  // ─── OODA Integration ────────────────────────────────────

  async analyzeForOODA(request: OODAAnalysisRequest): Promise<OODAAnalysisResponse> {
    const systemPrompt = OODA_SYSTEM_PROMPTS[request.phase];
    if (!systemPrompt) {
      throw new Error(`Unknown OODA phase: ${request.phase}`);
    }

    // Build file context
    const fileContext = Object.entries(request.fileContents)
      .map(([path, content]) => `=== ${path} ===\n${content}`)
      .join('\n\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          `## المشكلة`,
          request.issue,
          '',
          request.context ? `## سياق إضافي\n${request.context}\n` : '',
          `## الملفات المتأثرة`,
          fileContext,
        ].join('\n'),
      },
    ];

    const response = await this.chat(messages, {
      temperature: 0.2,
      maxTokens: 4096,
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) ||
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      return JSON.parse(jsonStr);
    } catch {
      return {
        analysis: content,
        suggestions: [],
        confidence: 0.5,
      };
    }
  }

  // ─── Simple Helper: Ask ──────────────────────────────────

  async ask(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.chat(messages);
    return response.choices[0]?.message?.content || '';
  }

  // ─── Usage Stats ─────────────────────────────────────────

  getUsageStats(): {
    totalRequests: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
  } {
    return {
      totalRequests: this.totalRequests,
      totalPromptTokens: this.totalPromptTokens,
      totalCompletionTokens: this.totalCompletionTokens,
      totalTokens: this.totalPromptTokens + this.totalCompletionTokens,
    };
  }

  resetUsageStats(): void {
    this.totalRequests = 0;
    this.totalPromptTokens = 0;
    this.totalCompletionTokens = 0;
  }

  // ─── API Key Validation ──────────────────────────────────

  async validateApiKey(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.chat(
        [{ role: 'user', content: 'Hi' }],
        { maxTokens: 1 }
      );
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message,
      };
    }
  }

  // ─── Internal: Fetch with Retry ──────────────────────────

  private async fetchWithRetry(
    endpoint: string,
    body: Record<string, unknown>,
    retries = MAX_RETRIES
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (response.status === 429) {
          // Rate limited — wait and retry
          const retryAfter = parseInt(response.headers.get('retry-after') || '2');
          await this.sleep(retryAfter * 1000);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Groq API error (${response.status}): ${errorBody}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          await this.sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Groq API request failed after retries');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ─── Singleton ───────────────────────────────────────────────

let groqInstance: GroqProvider | null = null;

export function getGroqProvider(config?: GroqConfig): GroqProvider {
  if (!groqInstance && config) {
    groqInstance = new GroqProvider(config);
  }
  if (!groqInstance) {
    groqInstance = new GroqProvider({ apiKey: '' });
  }
  return groqInstance;
}

export function resetGroqProvider(): void {
  groqInstance = null;
}
