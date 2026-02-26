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

async function callProvider(
  config: AgentConfig,
  messages: Array<{ role: string; content: string }>,
  tools: ToolDefinition[]
): Promise<{ content?: string; toolCalls?: ToolCall[] }> {
  const { provider, apiKey, model, temperature, maxTokens } = config;

  // Format tools for the API
  const formattedTools = tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        tools: formattedTools,
        tool_choice: 'auto',
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
    }
    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    return {
      content: choice?.content || undefined,
      toolCalls: choice?.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || '{}'),
      })),
    };
  }

  if (provider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        tools: formattedTools,
        tool_choice: 'auto',
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq error: ${res.status}`);
    }
    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    return {
      content: choice?.content || undefined,
      toolCalls: choice?.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || '{}'),
      })),
    };
  }

  if (provider === 'google') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini error: ${res.status}`);
    }
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: any) => p.text);
    const fnPart = parts.filter((p: any) => p.functionCall);
    return {
      content: textPart?.text || undefined,
      toolCalls: fnPart.length > 0 ? fnPart.map((p: any) => ({
        id: uuidv4(),
        name: p.functionCall.name,
        arguments: p.functionCall.args || {},
      })) : undefined,
    };
  }

  if (provider === 'anthropic') {
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
        system: messages.find((m) => m.role === 'system')?.content,
        messages: messages.filter((m) => m.role !== 'system'),
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters,
        })),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic error: ${res.status}`);
    }
    const data = await res.json();
    const textBlock = data.content?.find((b: any) => b.type === 'text');
    const toolBlocks = data.content?.filter((b: any) => b.type === 'tool_use') || [];
    return {
      content: textBlock?.text || undefined,
      toolCalls: toolBlocks.length > 0 ? toolBlocks.map((b: any) => ({
        id: b.id,
        name: b.name,
        arguments: b.input || {},
      })) : undefined,
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
    // Build message list for API
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content || '',
      })),
    ];

    let iterations = 0;
    const maxIterations = MAX_TOOL_ITERATIONS || 10;

    while (iterations < maxIterations) {
      iterations++;

      // Call the LLM
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
        // Notify UI about current tool call
        onToolCall?.(toolCall);

        // Find the tool definition to check risk level
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

          // Log the decision
          this.auditLog.push({
            id: uuidv4(),
            toolName: toolCall.name,
            args: toolCall.arguments,
            riskLevel,
            approved,
            timestamp: Date.now(),
          });

          if (!approved) {
            // Add rejection to context
            apiMessages.push({
              role: 'assistant',
              content: `أردت استخدام ${toolCall.name} لكن المستخدم رفض.`,
            });
            apiMessages.push({
              role: 'user',
              content: `تم رفض العملية: ${toolCall.name}. يرجى المتابعة بدونها.`,
            });
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

        // Log execution
        this.auditLog.push({
          id: uuidv4(),
          toolName: toolCall.name,
          args: toolCall.arguments,
          result,
          riskLevel,
          approved: true,
          timestamp: Date.now(),
        });

        // Add tool result to conversation for next LLM call
        apiMessages.push({
          role: 'assistant',
          content: response.content || `[Calling tool: ${toolCall.name}]`,
        });
        apiMessages.push({
          role: 'user',
          content: `Tool ${toolCall.name} result: ${JSON.stringify(result)}`,
        });
      }
    }

    // Max iterations reached
    return {
      id: uuidv4(),
      role: 'assistant',
      content: 'وصلت للحد الأقصى من الدورات. هل تريدني أن أكمل؟',
      createdAt: Date.now(),
    };
  }
}
