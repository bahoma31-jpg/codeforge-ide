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
  ProjectContext,
  RiskLevel,
} from './types';
import { createOpenAICompletion } from './providers/openai';
import { createGeminiCompletion } from './providers/google';
import { createGroqCompletion } from './providers/groq';
import { createAnthropicCompletion } from './providers/anthropic';

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

export const DEFAULT_SYSTEM_PROMPT_EN = `You are a smart coding assistant embedded in CodeForge IDE.

## Capabilities:
- Read, edit, create, and delete project files
- Git management: commit, push, branches, pull requests
- Explain code, fix bugs, suggest improvements
- Understand project context (package.json, tsconfig, file structure)

## Rules:
1. Always read files before editing — never assume content
2. Show proposed changes before applying them
3. For deletions or GitHub push — always ask for user confirmation
4. Write clean code with clear comments
5. If unsure — ask instead of assuming
`;

// ─── Agent Service ────────────────────────────────────────────

export class AgentService {
  private config: AgentConfig;
  private tools: ToolDefinition[];
  private auditLog: AuditLogEntry[] = [];
  private pendingApprovals: Map<string, PendingApproval> = new Map();
  private toolExecutors: Map<string, (args: Record<string, unknown>) => Promise<ToolCallResult>> = new Map();

  constructor(config: AgentConfig, tools: ToolDefinition[]) {
    this.config = config;
    this.tools = tools;
  }

  /**
   * Register a tool executor function
   */
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
    projectContext?: ProjectContext,
    onToolCall?: (toolCall: ToolCall) => void,
    onApprovalRequired?: (approval: PendingApproval) => Promise<boolean>
  ): Promise<AgentMessage> {
    // Build system prompt with project context
    const systemPrompt = this.buildSystemPrompt(projectContext);
    const configWithPrompt = { ...this.config, systemPrompt };

    // Agent loop: call LLM → execute tools → call LLM again → ...
    let currentMessages = [...messages];
    const MAX_ITERATIONS = 10;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      // Call the LLM
      const response = await this.callProvider(configWithPrompt, currentMessages);

      // Parse tool calls from response
      const toolCalls = this.parseToolCalls(response);
      const textContent = this.parseTextContent(response);

      // If no tool calls, return the text response
      if (toolCalls.length === 0) {
        return {
          id: uuidv4(),
          role: 'assistant',
          content: textContent || 'تم.',
          createdAt: Date.now(),
        };
      }

      // Create assistant message with tool calls
      const assistantMessage: AgentMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: textContent || '',
        toolCalls,
        createdAt: Date.now(),
      };
      currentMessages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of toolCalls) {
        onToolCall?.(toolCall);

        const result = await this.executeToolCall(
          toolCall,
          onApprovalRequired
        );

        // Add tool result message
        const toolResultMessage: AgentMessage = {
          id: uuidv4(),
          role: 'tool',
          content: JSON.stringify(result),
          toolCalls: [{ ...toolCall, result, status: result.success ? 'completed' : 'failed' }],
          createdAt: Date.now(),
        };
        currentMessages.push(toolResultMessage);
      }
    }

    // Max iterations reached
    return {
      id: uuidv4(),
      role: 'assistant',
      content: '⚠️ تم الوصول للحد الأقصى من التكرارات. يرجى إعادة صياغة الطلب.',
      createdAt: Date.now(),
    };
  }

  /**
   * Execute a single tool call with safety checks
   */
  private async executeToolCall(
    toolCall: ToolCall,
    onApprovalRequired?: (approval: PendingApproval) => Promise<boolean>
  ): Promise<ToolCallResult> {
    const tool = this.tools.find((t) => t.name === toolCall.toolName);
    if (!tool) {
      return { success: false, error: `Unknown tool: ${toolCall.toolName}` };
    }

    const executor = this.toolExecutors.get(toolCall.toolName);
    if (!executor) {
      return { success: false, error: `No executor registered for: ${toolCall.toolName}` };
    }

    // Check risk level
    if (tool.riskLevel === 'confirm' && onApprovalRequired) {
      const approval = this.createPendingApproval(toolCall, tool);
      const approved = await onApprovalRequired(approval);

      if (!approved) {
        this.logAction(toolCall, { success: false, error: 'Rejected by user' }, 'user');
        return { success: false, error: 'العملية رُفضت من قبل المستخدم.' };
      }
    }

    // Execute the tool
    try {
      const result = await executor(toolCall.args);
      this.logAction(toolCall, result, tool.riskLevel === 'auto' ? 'auto' : 'user');
      return result;
    } catch (error) {
      const errorResult: ToolCallResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      };
      this.logAction(toolCall, errorResult, 'auto');
      return errorResult;
    }
  }

  /**
   * Call the configured LLM provider
   */
  private async callProvider(
    config: AgentConfig,
    messages: AgentMessage[]
  ): Promise<Record<string, unknown>> {
    switch (config.provider) {
      case 'openai':
        return createOpenAICompletion(config, messages, this.tools);
      case 'google':
        return createGeminiCompletion(config, messages, this.tools);
      case 'groq':
        return createGroqCompletion(config, messages, this.tools);
      case 'anthropic':
        return createAnthropicCompletion(config, messages, this.tools);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Parse tool calls from provider response (handles all formats)
   */
  private parseToolCalls(response: Record<string, unknown>): ToolCall[] {
    const toolCalls: ToolCall[] = [];

    // OpenAI / Groq format
    const choices = (response as { choices?: Array<{ message?: { tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> } }> }).choices;
    if (choices?.[0]?.message?.tool_calls) {
      for (const tc of choices[0].message.tool_calls) {
        toolCalls.push({
          id: tc.id,
          toolName: tc.function.name,
          args: JSON.parse(tc.function.arguments),
          status: 'pending',
          createdAt: Date.now(),
        });
      }
      return toolCalls;
    }

    // Gemini format
    const candidates = (response as { candidates?: Array<{ content?: { parts?: Array<{ functionCall?: { name: string; args: Record<string, unknown> } }> } }> }).candidates;
    if (candidates?.[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.functionCall) {
          toolCalls.push({
            id: uuidv4(),
            toolName: part.functionCall.name,
            args: part.functionCall.args,
            status: 'pending',
            createdAt: Date.now(),
          });
        }
      }
      return toolCalls;
    }

    // Anthropic format
    const content = (response as { content?: Array<{ type: string; id?: string; name?: string; input?: Record<string, unknown> }> }).content;
    if (content) {
      for (const block of content) {
        if (block.type === 'tool_use' && block.id && block.name) {
          toolCalls.push({
            id: block.id,
            toolName: block.name,
            args: block.input || {},
            status: 'pending',
            createdAt: Date.now(),
          });
        }
      }
    }

    return toolCalls;
  }

  /**
   * Parse text content from provider response
   */
  private parseTextContent(response: Record<string, unknown>): string {
    // OpenAI / Groq
    const choices = (response as { choices?: Array<{ message?: { content?: string } }> }).choices;
    if (choices?.[0]?.message?.content) {
      return choices[0].message.content;
    }

    // Gemini
    const candidates = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
    if (candidates?.[0]?.content?.parts) {
      const textParts = candidates[0].content.parts
        .filter((p) => p.text)
        .map((p) => p.text);
      if (textParts.length > 0) return textParts.join('');
    }

    // Anthropic
    const content = (response as { content?: Array<{ type: string; text?: string }> }).content;
    if (content) {
      const textBlocks = content.filter((b) => b.type === 'text' && b.text);
      if (textBlocks.length > 0) return textBlocks.map((b) => b.text).join('');
    }

    return '';
  }

  /**
   * Build system prompt with project context
   */
  private buildSystemPrompt(projectContext?: ProjectContext): string {
    const base = this.config.language === 'ar'
      ? this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT
      : this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT_EN;

    if (!projectContext) return base;

    const contextSection = `
## سياق المشروع الحالي:
- اسم المشروع: ${projectContext.projectName}
- اللغة الرئيسية: ${projectContext.mainLanguage}
- المستودع: ${projectContext.repoUrl || 'محلي'}
- الفرع الحالي: ${projectContext.currentBranch || 'غير محدد'}

## بنية الملفات:
\`\`\`
${projectContext.fileTree}
\`\`\`
`;

    return base + contextSection;
  }

  /**
   * Create a pending approval for a dangerous operation
   */
  private createPendingApproval(
    toolCall: ToolCall,
    tool: ToolDefinition
  ): PendingApproval {
    const approval: PendingApproval = {
      id: uuidv4(),
      toolCall,
      description: `${tool.description} — ${JSON.stringify(toolCall.args)}`,
      riskLevel: tool.riskLevel,
      affectedFiles: this.extractAffectedFiles(toolCall),
      status: 'pending',
      createdAt: Date.now(),
    };

    this.pendingApprovals.set(approval.id, approval);
    return approval;
  }

  /**
   * Extract affected file paths from tool call arguments
   */
  private extractAffectedFiles(toolCall: ToolCall): string[] {
    const files: string[] = [];
    const args = toolCall.args;

    if (typeof args.path === 'string') files.push(args.path);
    if (typeof args.filePath === 'string') files.push(args.filePath);
    if (typeof args.fileId === 'string') files.push(args.fileId);
    if (typeof args.nodeId === 'string') files.push(args.nodeId);
    if (Array.isArray(args.paths)) {
      files.push(...(args.paths as string[]));
    }

    return files;
  }

  /**
   * Log action to audit log
   */
  private logAction(
    toolCall: ToolCall,
    result: ToolCallResult,
    approvedBy: 'auto' | 'user'
  ): void {
    this.auditLog.push({
      id: uuidv4(),
      toolName: toolCall.toolName,
      args: toolCall.args,
      result,
      approvedBy,
      timestamp: Date.now(),
    });
  }

  /**
   * Get audit log
   */
  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  /**
   * Update agent configuration
   */
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }
}
