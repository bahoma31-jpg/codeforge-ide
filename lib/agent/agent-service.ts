/**
 * CodeForge IDE — Agent Service (Core Engine) v2.4
 * Orchestrates the AI agent: sends messages, handles tool calls,
 * manages the conversation loop, and enforces safety rules.
 *
 * v2.4 — Full OODA Loop Integration:
 *   - Added SECTION 2F: OODA Loop Tools (5 tools)
 *   - Enhanced SECTION 10: Self-Improvement with active OODA protocol
 *   - Updated tool count: 48 → 53 (5 OODA tools)
 *   - All previous safety and tool handling unchanged
 *
 * v2.3 — Self-Improvement Protocol:
 *   - Added SECTION 10: Self-Improvement OODA Loop
 *   - Added SECTION 2E: Self-Improvement Tools
 *   - Updated tool count: 45 → 48 (3 self-improve tools)
 *
 * v2.2 — Triple-layer safety integration:
 *   - Uses processToolSafety() from safety/index.ts
 *   - Added onNotify callback for NOTIFY-level tools
 *   - CONFIRM tools await onApprovalRequired() (unchanged API)
 *   - AUTO tools execute silently (unchanged)
 *   - Backward compatible: onNotify is optional
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RiskLevel,
  ProjectContext,
} from './types';
import { MAX_TOOL_ITERATIONS } from './constants';
import { getAuditLogger, type AuditLogger } from './audit-logger';
import { processToolSafety, type ToolNotification } from './safety';

// ─── System Prompt (extracted to system-prompt.ts) ────────────
// مستخرج في ملف مستقل لتحسين قابلية الصيانة (1152 سطر → ملف خارجي)
export {
  SYSTEM_PROMPT_TEMPLATE,
  buildSystemPrompt,
  DEFAULT_SYSTEM_PROMPT,
} from './system-prompt';

// ─── Provider Callers ─────────────────────────────────────────

interface ProviderResponse {
  content?: string;
  toolCalls?: ToolCall[];
}

function parseToolCalls(
  rawToolCalls: Array<{
    id?: string;
    function?: { name: string; arguments: string };
    name?: string;
    arguments?: Record<string, unknown>;
  }>
): ToolCall[] {
  return rawToolCalls.map((tc) => {
    if (tc.function) {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(tc.function.arguments || '{}');
      } catch {
        parsedArgs = {};
      }
      return {
        id: tc.id || uuidv4(),
        name: tc.function.name,
        arguments: parsedArgs,
      };
    }
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
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
      const err = await res
        .json()
        .catch(() => ({ error: { message: `HTTP ${res.status}` } }));
      throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
    }
    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    return {
      content: choice?.content || undefined,
      toolCalls: choice?.tool_calls
        ? parseToolCalls(choice.tool_calls)
        : undefined,
    };
  }

  // ── Groq ──
  if (provider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
      const err = await res
        .json()
        .catch(() => ({ error: { message: `HTTP ${res.status}` } }));
      throw new Error(err.error?.message || `Groq error: ${res.status}`);
    }
    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    return {
      content: choice?.content || undefined,
      toolCalls: choice?.tool_calls
        ? parseToolCalls(choice.tool_calls)
        : undefined,
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
            parts: [
              {
                text:
                  messages.find((m) => m.role === 'system')?.content ||
                  SYSTEM_PROMPT_TEMPLATE,
              },
            ],
          },
          tools: [
            {
              functionDeclarations: tools.map((t) => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              })),
            },
          ],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      }
    );
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: { message: `HTTP ${res.status}` } }));
      throw new Error(err.error?.message || `Gemini error: ${res.status}`);
    }
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: Record<string, unknown>) => p.text);
    const fnParts = parts.filter(
      (p: Record<string, unknown>) => p.functionCall
    );
    return {
      content: (textPart?.text as string) || undefined,
      toolCalls:
        fnParts.length > 0
          ? fnParts.map((p: Record<string, unknown>) => {
              const fc = p.functionCall as {
                name: string;
                args?: Record<string, unknown>;
              };
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
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters,
        })),
      }),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: { message: `HTTP ${res.status}` } }));
      throw new Error(err.error?.message || `Anthropic error: ${res.status}`);
    }
    const data = await res.json();
    const textBlock = data.content?.find(
      (b: Record<string, unknown>) => b.type === 'text'
    );
    const toolBlocks =
      data.content?.filter(
        (b: Record<string, unknown>) => b.type === 'tool_use'
      ) || [];
    return {
      content: (textBlock?.text as string) || undefined,
      toolCalls:
        toolBlocks.length > 0
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
  private auditLogger: AuditLogger;
  private toolExecutors: Map<
    string,
    (args: Record<string, unknown>) => Promise<ToolCallResult>
  > = new Map();

  /** Anti-loop tracking: counts consecutive calls to the same tool */
  private toolCallTracker: Map<string, number> = new Map();
  private static readonly MAX_SAME_TOOL_CALLS = 3;

  constructor(config: AgentConfig, tools: ToolDefinition[]) {
    this.config = config;
    this.tools = tools;
    this.auditLogger = getAuditLogger();
  }

  /** Update configuration */
  updateConfig(config: AgentConfig): void {
    this.config = config;
  }

  /** Get audit log entries (from persistent storage) */
  getAuditLog(): AuditLogEntry[] {
    return this.auditLogger.getAll();
  }

  /** Get the audit logger instance for advanced operations */
  getAuditLoggerInstance(): AuditLogger {
    return this.auditLogger;
  }

  /** Register a tool executor function */
  registerToolExecutor(
    toolName: string,
    executor: (args: Record<string, unknown>) => Promise<ToolCallResult>
  ): void {
    this.toolExecutors.set(toolName, executor);
  }

  /** Reset anti-loop tracker (call at start of new user message) */
  private resetToolTracker(): void {
    this.toolCallTracker.clear();
  }

  /**
   * Check if a tool call should be blocked by anti-loop protection.
   * Returns true if the tool has been called too many times consecutively.
   */
  private isToolLooping(
    toolName: string,
    args: Record<string, unknown>
  ): boolean {
    const key = `${toolName}:${JSON.stringify(args)}`;
    const count = (this.toolCallTracker.get(key) || 0) + 1;
    this.toolCallTracker.set(key, count);
    return count > AgentService.MAX_SAME_TOOL_CALLS;
  }

  /**
   * Send a message and get a response (with tool calling loop).
   *
   * v2.2 — Triple-layer safety:
   *   - onToolCall: callback when any tool is invoked (for UI status)
   *   - onNotify: callback for NOTIFY-level tools (shows notification, doesn't block)
   *   - onApprovalRequired: callback for CONFIRM-level tools (blocks until user decides)
   *
   * onNotify is optional for backward compatibility.
   */
  async sendMessage(
    messages: AgentMessage[],
    systemPrompt?: string,
    onToolCall?: (toolCall: ToolCall) => void,
    onApprovalRequired?: (approval: PendingApproval) => Promise<boolean>,
    projectContext?: ProjectContext,
    onNotify?: (notification: ToolNotification) => void
  ): Promise<AgentMessage> {
    // Reset anti-loop tracker for each new user message
    this.resetToolTracker();

    // Build the full system prompt with injected runtime variables
    const resolvedPrompt =
      systemPrompt || buildSystemPrompt(this.config, projectContext);

    const apiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: resolvedPrompt },
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
        const category = toolDef?.category || 'utility';

        // ── Anti-loop check ──
        if (this.isToolLooping(toolCall.name, toolCall.arguments)) {
          const loopMsg = `⚠️ تم اكتشاف تكرار: الأداة "${toolCall.name}" استُدعيت أكثر من ${AgentService.MAX_SAME_TOOL_CALLS} مرات بنفس المعاملات. أتوقف وأطلب توجيهاتك.`;
          apiMessages.push({ role: 'assistant', content: loopMsg });
          apiMessages.push({
            role: 'user',
            content:
              'تم إيقاف التكرار بواسطة نظام الحماية. أعد صياغة المهمة أو جرب نهجاً مختلفاً.',
          });
          continue;
        }

        // ══════════════════════════════════════════════════════
        // TRIPLE-LAYER SAFETY — processToolSafety() decides
        // ══════════════════════════════════════════════════════
        const safetyAction = processToolSafety(toolCall, toolDef);

        // ── Start audit tracking (captures duration) ──
        const auditTracker = this.auditLogger.logStart(
          toolCall.name,
          toolCall.arguments,
          safetyAction.riskLevel,
          category
        );

        // ── CONFIRM: Block and wait for user approval ──
        if (safetyAction.type === 'confirm' && onApprovalRequired) {
          const approved = await onApprovalRequired(safetyAction.approval);

          if (!approved) {
            // Log the rejection with duration
            auditTracker.reject();

            apiMessages.push({
              role: 'assistant',
              content: `أردت تنفيذ عملية حساسة (${toolCall.name}) لكن المستخدم رفض.`,
            });
            apiMessages.push({
              role: 'user',
              content: `تم رفض العملية: ${toolCall.name}. يرجى المتابعة بدونها.`,
            });
            continue;
          }
        }

        // ── NOTIFY: Show notification (non-blocking) then execute ──
        if (safetyAction.type === 'notify' && onNotify) {
          onNotify(safetyAction.notification);
        }

        // ── Execute the tool (AUTO, NOTIFY after notification, CONFIRM after approval) ──
        const executor = this.toolExecutors.get(toolCall.name);
        let result: ToolCallResult;

        if (executor) {
          try {
            result = await executor(toolCall.arguments);
          } catch (error) {
            result = { success: false, error: (error as Error).message };
          }
        } else {
          result = {
            success: false,
            error: `Tool '${toolCall.name}' not registered`,
          };
        }

        // ── Log the result with duration ──
        const approvedBy: 'auto' | 'user' | 'notify' =
          safetyAction.type === 'confirm'
            ? 'user'
            : safetyAction.type === 'notify'
              ? 'notify'
              : 'auto';
        auditTracker.finish(result, true, approvedBy);

        // Add tool result to conversation
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

    return {
      id: uuidv4(),
      role: 'assistant',
      content: '⚠️ وصلت للحد الأقصى من الدورات. هل تريدني أن أكمل بنهج مختلف؟',
      createdAt: Date.now(),
    };
  }
}
