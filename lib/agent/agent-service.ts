/**
 * CodeForge IDE — Agent Service (Core Engine)
 * Orchestrates the AI agent: sends messages, handles tool calls,
 * manages the conversation loop, and enforces safety rules.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  AgentMessage,
  ToolDefinition,
  ToolCall,
  ToolCallResult,
  PendingApproval,
  AuditLogEntry,
  RiskLevel,
} from './types';
import { MAX_TOOL_ITERATIONS } from './constants';

// ─── Default System Prompt ────────────────────────────────────

export const DEFAULT_SYSTEM_PROMPT = `أنت مساعد برمجي ذكي مدمج في CodeForge IDE.

## قدراتك:
- قراءة وتعديل وإنشاء وحذف الملفات في المشروع
- إدارة Git: commit, push, branches, pull requests
- شرح الكود وإصلاح الأخطاء واقتراح تحسينات
- فهم سياق المشروع (package.json, tsconfig, بنية الملفات)

## قواعدك:
1. اقرأ الملفات أولاً قبل التعديل — لا تفترض المحتوى
2. اعرض التغييرات المقترحة قبل تطبيقها
3. عند الحذف أو الدفع لـ GitHub — اطلب تأكيد المستخدم دائماً
4. اكتب كود نظيف مع تعليقات واضحة
5. إذا لم تكن متأكداً — اسأل بدلاً من الافتراض
6. تواصل مع المستخدم بنفس لغته (عربية أو إنجليزية)
`;

// ─── Provider Callers ─────────────────────────────────────────

interface ProviderResponse {
  content?: string;
  toolCalls?: ToolCall[];
}

function parseToolCalls(rawToolCalls: Array<{ id?: string; function?: { name: string; arguments: string }; name?: string; arguments?: Record<string, unknown> }>): ToolCall[] {
  return rawToolCalls.map((tc) => {
    if (tc.function) {
      // OpenAI / Groq format
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(tc.function.arguments || '{}');
      } catch { parsedArgs = {}; }
      return {
        id: tc.id || uuidv4(),
        name: tc.function.name,
        arguments: parsedArgs,
      };
    }
    // Pre-parsed format
    return {
      id: tc.id || uuidv4(),
      name: tc.name || '',
      arguments: tc.arguments || {},
    };
  });
}

async function callProvider(
  config: AgentConfig,
  messages: Array<{ role: string; content: string }>,
  tools: ToolDefinition[]
): Promise<ProviderResponse> {
  const { provider, apiKey, model, temperature, maxTokens } = config;

  const formattedTools = tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  // ── OpenAI ──
  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, tools: formattedTools, tool_choice: 'auto', temperature, max_tokens: maxTokens }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
      throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
    }
    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    return {
      content: choice?.content || undefined,
      toolCalls: choice?.tool_calls ? parseToolCalls(choice.tool_calls) : undefined,
    };
  }

  // ── Groq ──
  if (provider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, tools: formattedTools, tool_choice: 'auto', temperature, max_tokens: maxTokens }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
      throw new Error(err.error?.message || `Groq error: ${res.status}`);
    }
    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    return {
      content: choice?.content || undefined,
      toolCalls: choice?.tool_calls ? parseToolCalls(choice.tool_calls) : undefined,
    };
  }

  // ── Google Gemini ──
  if (provider === 'google') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
          systemInstruction: {
            parts: [{ text: messages.find((m) => m.role === 'system')?.content || DEFAULT_SYSTEM_PROMPT }],
          },
          tools: [{
            functionDeclarations: tools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            })),
          }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
      throw new Error(err.error?.message || `Gemini error: ${res.status}`);
    }
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: Record<string, unknown>) => p.text);
    const fnParts = parts.filter((p: Record<string, unknown>) => p.functionCall);
    return {
      content: (textPart?.text as string) || undefined,
      toolCalls: fnParts.length > 0
        ? fnParts.map((p: Record<string, unknown>) => {
            const fc = p.functionCall as { name: string; args?: Record<string, unknown> };
            return {
              id: uuidv4(),
              name: fc.name,
              arguments: fc.args || {},
            };
          })
        : undefined,
    };
  }

  // ── Anthropic ──
  if (provider === 'anthropic') {
    const systemMsg = messages.find((m) => m.role === 'system')?.content;
    const nonSystemMsgs = messages.filter((m) => m.role !== 'system');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens || 4096,
        system: systemMsg,
        messages: nonSystemMsgs,
        tools: tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
      throw new Error(err.error?.message || `Anthropic error: ${res.status}`);
    }
    const data = await res.json();
    const textBlock = data.content?.find((b: Record<string, unknown>) => b.type === 'text');
    const toolBlocks = data.content?.filter((b: Record<string, unknown>) => b.type === 'tool_use') || [];
    return {
      content: (textBlock?.text as string) || undefined,
      toolCalls: toolBlocks.length > 0
        ? toolBlocks.map((b: Record<string, unknown>) => ({
            id: b.id as string,
            name: b.name as string,
            arguments: (b.input as Record<string, unknown>) || {},
          }))
        : undefined,
    };
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// ─── Agent Service ────────────────────────────────────────────

export class AgentService {
  private config: AgentConfig;
  private tools: ToolDefinition[];
  private auditLog: AuditLogEntry[] = [];
  private toolExecutors: Map<string, (args: Record<string, unknown>) => Promise<ToolCallResult>> = new Map();

  constructor(config: AgentConfig, tools: ToolDefinition[]) {
    this.config = config;
    this.tools = tools;
  }

  /** Update configuration */
  updateConfig(config: AgentConfig): void {
    this.config = config;
  }

  /** Get audit log */
  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  /** Register a tool executor function */
  registerToolExecutor(
    toolName: string,
    executor: (args: Record<string, unknown>) => Promise<ToolCallResult>
  ): void {
    this.toolExecutors.set(toolName, executor);
  }

  /**
   * Send a message and get a response (with tool calling loop)
   */
  async sendMessage(
    messages: AgentMessage[],
    systemPrompt?: string,
    onToolCall?: (toolCall: ToolCall) => void,
    onApprovalRequired?: (approval: PendingApproval) => Promise<boolean>
  ): Promise<AgentMessage> {
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt || this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content || '' })),
    ];

    let iterations = 0;
    const maxIterations = MAX_TOOL_ITERATIONS || 10;

    while (iterations < maxIterations) {
      iterations++;

      const response = await callProvider(this.config, apiMessages, this.tools);

      // If no tool calls, return the text response
      if (!response.toolCalls || response.toolCalls.length === 0) {
        return {
          id: uuidv4(),
          role: 'assistant',
          content: response.content || 'لم أتمكن من إنشاء رد.',
          createdAt: Date.now(),
        };
      }

      // Process each tool call
      for (const toolCall of response.toolCalls) {
        onToolCall?.(toolCall);

        const toolDef = this.tools.find((t) => t.name === toolCall.name);
        const riskLevel: RiskLevel = toolDef?.riskLevel || 'notify';

        // If high risk, request approval
        if (riskLevel === 'confirm' && onApprovalRequired) {
          const approval: PendingApproval = {
            id: uuidv4(),
            toolCall,
            toolName: toolCall.name,
            description: `الوكيل يريد تنفيذ: ${toolCall.name}`,
            riskLevel,
            status: 'pending',
            createdAt: Date.now(),
          };

          const approved = await onApprovalRequired(approval);

          this.auditLog.push({
            id: uuidv4(),
            toolName: toolCall.name,
            args: toolCall.arguments,
            riskLevel,
            approved,
            timestamp: Date.now(),
          });

          if (!approved) {
            apiMessages.push({ role: 'assistant', content: `أردت استخدام ${toolCall.name} لكن المستخدم رفض.` });
            apiMessages.push({ role: 'user', content: `تم رفض العملية: ${toolCall.name}. يرجى المتابعة بدونها.` });
            continue;
          }
        }

        // Execute the tool
        const executor = this.toolExecutors.get(toolCall.name);
        let result: ToolCallResult;

        if (executor) {
          try {
            result = await executor(toolCall.arguments);
          } catch (error) {
            result = { success: false, error: (error as Error).message };
          }
        } else {
          result = { success: false, error: `Tool '${toolCall.name}' not registered` };
        }

        this.auditLog.push({
          id: uuidv4(),
          toolName: toolCall.name,
          args: toolCall.arguments,
          result,
          riskLevel,
          approved: true,
          timestamp: Date.now(),
        });

        // Add tool result to conversation
        apiMessages.push({ role: 'assistant', content: response.content || `[Calling tool: ${toolCall.name}]` });
        apiMessages.push({ role: 'user', content: `Tool ${toolCall.name} result: ${JSON.stringify(result)}` });
      }
    }

    return {
      id: uuidv4(),
      role: 'assistant',
      content: 'وصلت للحد الأقصى من الدورات. هل تريدني أن أكمل؟',
      createdAt: Date.now(),
    };
  }
}
