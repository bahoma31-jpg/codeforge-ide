/**
 * CodeForge IDE — Agent Service OODA Integration (Phase 8)
 * Extends AgentService with OODABridge for self-improvement capabilities.
 *
 * This module wraps the original AgentService and adds:
 * 1. Automatic SELF-IMPROVE mode detection
 * 2. OODABridge routing for self-improvement tasks
 * 3. Groq LLM fallback when primary provider fails
 * 4. Unified event stream for UI components
 *
 * Usage:
 *   const service = new OODAAgentService(config, tools);
 *   service.initOODA({ groqApiKey: '...', modelId: '...' });
 *   const response = await service.sendMessage(messages);
 */

import { AgentService, buildSystemPrompt } from './agent-service';
import { OODABridge, getOODABridge, type OODABridgeConfig, type SelfImproveRequest, type SelfImproveResult, type BridgeEvent } from './bridge';
import type { AgentConfig, AgentMessage, ToolDefinition, ToolCall, PendingApproval, ProjectContext } from './types';
import type { ToolNotification } from './safety';
import { v4 as uuidv4 } from 'uuid';

// ─── Self-Improve Detection ──────────────────────────────────────

const SELF_IMPROVE_KEYWORDS_AR = [
  'خطأ في الواجهة',
  'مشكلة في',
  'لا يعمل',
  'لا تعمل',
  'أصلح',
  'حسّن',
  'عدّل',
  'الزر لا',
  'الشاشة',
  'خلل',
  'باغ',
  'تحسين الأداء',
  'بطيء',
  'self-improve',
  'fix the',
  'bug in',
  'broken',
  'doesn\'t work',
  'improve',
  'حلّ المشكلة',
  'أصلح الكود',
];

const SELF_IMPROVE_FILE_PATTERNS = [
  'components/',
  'lib/agent/',
  'lib/stores/',
  'app/',
  'hooks/',
];

function detectSelfImproveIntent(message: string): boolean {
  const lower = message.toLowerCase();
  return SELF_IMPROVE_KEYWORDS_AR.some(kw => lower.includes(kw.toLowerCase()));
}

function extractCategory(message: string): SelfImproveRequest['category'] {
  const lower = message.toLowerCase();
  if (lower.includes('أداء') || lower.includes('بطيء') || lower.includes('performance')) return 'performance';
  if (lower.includes('تصميم') || lower.includes('style') || lower.includes('css')) return 'style';
  if (lower.includes('وصول') || lower.includes('accessibility') || lower.includes('a11y')) return 'accessibility';
  if (lower.includes('واجه') || lower.includes('ui') || lower.includes('زر') || lower.includes('شاشة')) return 'ui_bug';
  return 'logic_error';
}

// ─── OODA-Aware Agent Service ────────────────────────────────────

export type OODAMode = 'chat' | 'self-improve' | 'hybrid';

export interface OODAAgentEvent {
  type: 'mode_change' | 'ooda_start' | 'ooda_complete' | 'ooda_error' | 'ooda_phase';
  mode?: OODAMode;
  data?: unknown;
  timestamp: number;
}

export type OODAAgentEventHandler = (event: OODAAgentEvent) => void;

export class OODAAgentService extends AgentService {
  private bridge: OODABridge | null = null;
  private currentMode: OODAMode = 'chat';
  private oodaEventHandlers: Set<OODAAgentEventHandler> = new Set();
  private autoDetect: boolean = true;
  private lastSelfImproveResult: SelfImproveResult | null = null;

  constructor(config: AgentConfig, tools: ToolDefinition[]) {
    super(config, tools);
  }

  // ─── OODA Initialization ─────────────────────────────────────

  /**
   * Initialize the OODA Bridge with Groq API credentials.
   * Call this after constructing the service, when the user
   * provides their Groq API key in settings.
   */
  initOODA(config: OODABridgeConfig): void {
    this.bridge = new OODABridge(config);
    // Forward bridge events to our event system
    this.bridge.onEvent((bridgeEvent: BridgeEvent) => {
      this.emitOODA({
        type: 'ooda_phase',
        data: bridgeEvent,
      });
    });
  }

  /** Get or initialize the bridge via singleton */
  getBridge(): OODABridge | null {
    return this.bridge;
  }

  /** Check if OODA capabilities are available */
  isOODAReady(): boolean {
    return this.bridge?.isReady() ?? false;
  }

  /** Set auto-detection of self-improve intent */
  setAutoDetect(enabled: boolean): void {
    this.autoDetect = enabled;
  }

  /** Get the last self-improve analysis result */
  getLastSelfImproveResult(): SelfImproveResult | null {
    return this.lastSelfImproveResult;
  }

  // ─── Mode Management ─────────────────────────────────────────

  getMode(): OODAMode {
    return this.currentMode;
  }

  setMode(mode: OODAMode): void {
    const old = this.currentMode;
    this.currentMode = mode;
    if (old !== mode) {
      this.emitOODA({ type: 'mode_change', mode });
    }
  }

  // ─── Enhanced sendMessage ────────────────────────────────────

  /**
   * Enhanced sendMessage that detects self-improve intent
   * and routes to OODABridge when appropriate.
   *
   * Flow:
   * 1. Check if message triggers SELF-IMPROVE mode
   * 2. If yes AND bridge is ready → run OODA analysis cycle
   * 3. Format OODA results as AgentMessage
   * 4. If no → delegate to original AgentService.sendMessage()
   */
  async sendMessageWithOODA(
    messages: AgentMessage[],
    systemPrompt?: string,
    onToolCall?: (toolCall: ToolCall) => void,
    onApprovalRequired?: (approval: PendingApproval) => Promise<boolean>,
    projectContext?: ProjectContext,
    onNotify?: (notification: ToolNotification) => void
  ): Promise<AgentMessage> {
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.content || '';

    // Check for self-improve intent
    const isSelfImprove = this.autoDetect && detectSelfImproveIntent(userText);

    if (isSelfImprove && this.bridge?.isReady()) {
      this.setMode('self-improve');
      this.emitOODA({ type: 'ooda_start', data: { message: userText } });

      try {
        // Build a minimal self-improve request
        // In real usage, the agent would first call self_* tools to gather files
        const request: SelfImproveRequest = {
          issue: userText,
          category: extractCategory(userText),
          fileContents: {}, // Will be populated by self_* tools in the OODA cycle
          affectedFiles: [],
          context: `المستخدم يبلغ عن مشكلة: ${userText}`,
        };

        const result = await this.bridge.runAnalysisCycle(request);
        this.lastSelfImproveResult = result;

        this.emitOODA({ type: 'ooda_complete', data: result });

        // Format OODA result as agent message
        return this.formatOODAResult(result);

      } catch (error) {
        this.emitOODA({ type: 'ooda_error', data: { error: (error as Error).message } });
        // Fallback to normal chat if OODA fails
        this.setMode('chat');
      }
    }

    // Default: use original AgentService
    this.setMode('chat');
    return super.sendMessage(
      messages,
      systemPrompt,
      onToolCall,
      onApprovalRequired,
      projectContext,
      onNotify
    );
  }

  // ─── Event System ────────────────────────────────────────────

  onOODAEvent(handler: OODAAgentEventHandler): () => void {
    this.oodaEventHandlers.add(handler);
    return () => this.oodaEventHandlers.delete(handler);
  }

  private emitOODA(event: Omit<OODAAgentEvent, 'timestamp'>): void {
    const fullEvent: OODAAgentEvent = { ...event, timestamp: Date.now() };
    this.oodaEventHandlers.forEach(h => h(fullEvent));
  }

  // ─── Format OODA Results ─────────────────────────────────────

  private formatOODAResult(result: SelfImproveResult): AgentMessage {
    if (!result.success) {
      return {
        id: uuidv4(),
        role: 'assistant',
        content: `## ⚠️ تعذّر إكمال التحليل\n\n${result.error || 'خطأ غير معروف'}\n\n**معرّف الدورة:** \`${result.cycleId}\``,
        createdAt: Date.now(),
      };
    }

    const sections: string[] = [];

    // Header
    sections.push(`## 🔄 تحليل التحسين الذاتي`);
    sections.push(`**معرّف الدورة:** \`${result.cycleId}\`\n`);

    // Observe phase
    if (result.analyses.observe) {
      sections.push(`### 👁️ الرصد (Observe)`);
      sections.push(result.analyses.observe.analysis);
    }

    // Orient phase
    if (result.analyses.orient) {
      sections.push(`\n### 🧭 التحليل (Orient)`);
      sections.push(result.analyses.orient.analysis);
      if (result.analyses.orient.suggestions.length > 0) {
        sections.push(`\n**اقتراحات:**`);
        result.analyses.orient.suggestions.forEach((s, i) => {
          sections.push(`${i + 1}. ${s}`);
        });
      }
    }

    // Decide phase
    if (result.analyses.decide) {
      sections.push(`\n### 📋 القرار (Decide)`);
      sections.push(result.analyses.decide.analysis);
    }

    // Proposed fixes
    if (result.proposedFixes.length > 0) {
      sections.push(`\n### ⚡ الإصلاحات المقترحة`);
      result.proposedFixes.forEach((fix, i) => {
        sections.push(`\n**${i + 1}. \`${fix.filePath}\`** (${fix.type})`);
        sections.push(fix.explanation);
        if (fix.type === 'edit' && fix.oldStr && fix.newStr) {
          sections.push(`\`\`\`diff\n- ${fix.oldStr}\n+ ${fix.newStr}\n\`\`\``);
        }
      });
      sections.push(`\n> هل تريدني أن أنفذ هذه الإصلاحات؟ اكتب **"نفّذ"** للمتابعة.`);
    }

    // Token usage
    sections.push(`\n---\n*🪙 الاستهلاك: ${result.tokenUsage.totalTokens.toLocaleString()} tokens*`);

    return {
      id: uuidv4(),
      role: 'assistant',
      content: sections.join('\n'),
      createdAt: Date.now(),
    };
  }

  // ─── Cleanup ─────────────────────────────────────────────────

  dispose(): void {
    this.bridge?.dispose();
    this.oodaEventHandlers.clear();
  }
}

// ─── Factory ──────────────────────────────────────────────────────

export function createOODAAgentService(
  config: AgentConfig,
  tools: ToolDefinition[],
  oodaConfig?: OODABridgeConfig
): OODAAgentService {
  const service = new OODAAgentService(config, tools);
  if (oodaConfig) {
    service.initOODA(oodaConfig);
  }
  return service;
}
