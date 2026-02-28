/**
 * CodeForge IDE — Agent LLM Adapter (Phase 7)
 * Adapts GroqProvider to work as a drop-in replacement for
 * AgentService's callProvider() function.
 *
 * This allows the agent to use Groq's enhanced models (14 models)
 * while maintaining compatibility with the existing 4-provider system.
 *
 * Usage in agent-service.ts:
 *   const adapter = new AgentLLMAdapter(groqProvider);
 *   const response = await adapter.callAsProvider(config, messages, tools);
 */

import { GroqProvider } from '../llm';
import type { ToolDefinition, ToolCall } from '../types';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ──────────────────────────────────────────────────────

interface ProviderMessage {
  role: string;
  content: string;
}

interface ProviderResponse {
  content?: string;
  toolCalls?: ToolCall[];
}

interface FormattedTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

// ─── Adapter Class ──────────────────────────────────────────────

export class AgentLLMAdapter {
  private groq: GroqProvider;

  constructor(groq: GroqProvider) {
    this.groq = groq;
  }

  /**
   * Call Groq as if it were any provider in agent-service's callProvider().
   * Translates tool definitions to OpenAI format (Groq is compatible),
   * sends the request, and parses the response including tool calls.
   */
  async callAsProvider(
    messages: ProviderMessage[],
    tools: ToolDefinition[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<ProviderResponse> {
    const formattedTools: FormattedTool[] = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    // Build request body (Groq uses OpenAI-compatible format)
    const body = {
      model: options?.model || this.groq.getModel(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      tools: formattedTools,
      tool_choice: 'auto' as const,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 8192,
    };

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getApiKey()}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response
        .json()
        .catch(() => ({ error: { message: `HTTP ${response.status}` } }));
      throw new Error(err.error?.message || `Groq error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message;

    return {
      content: choice?.content || undefined,
      toolCalls: choice?.tool_calls
        ? this.parseToolCalls(choice.tool_calls)
        : undefined,
    };
  }

  /**
   * Stream a response for real-time UI display.
   * Returns an async generator of text chunks.
   */
  async *streamResponse(
    messages: ProviderMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): AsyncGenerator<string, void, unknown> {
    const chatMessages = messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    yield* this.groq.chatStream(chatMessages, {
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });
  }

  // ─── Internals ────────────────────────────────────────────

  private parseToolCalls(
    rawToolCalls: Array<{
      id?: string;
      function?: { name: string; arguments: string };
    }>
  ): ToolCall[] {
    return rawToolCalls.map((tc) => {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(tc.function?.arguments || '{}');
      } catch {
        parsedArgs = {};
      }
      return {
        id: tc.id || uuidv4(),
        name: tc.function?.name || '',
        arguments: parsedArgs,
      };
    });
  }

  private getApiKey(): string {
    // Access the apiKey through GroqProvider's internal state
    // The provider exposes isConfigured() but not the key directly,
    // so we use a reflection pattern that works with the class.
    return (this.groq as unknown as { apiKey: string }).apiKey || '';
  }
}
