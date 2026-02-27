/**
 * CodeForge IDE — OODA Bridge (Phase 7)
 * Connects AgentService ↔ OODAController ↔ GroqProvider into one unified system.
 *
 * This is the central integration point that:
 * 1. Intercepts SELF-IMPROVE mode triggers from AgentService
 * 2. Routes analysis requests to GroqProvider (LLM brain)
 * 3. Feeds LLM responses into OODAController (execution engine)
 * 4. Returns results back to AgentService for user display
 *
 * Architecture:
 * ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 * │ AgentService  │────▶│  OODABridge  │────▶│ OODAController│
 * │ (User Chat)   │◀────│  (Router)    │◀────│ (Engine)      │
 * └──────────────┘     │              │     └──────────────┘
 *                      │              │     ┌──────────────┐
 *                      │              │────▶│ GroqProvider  │
 *                      │              │◀────│ (LLM Brain)   │
 *                      └──────────────┘     └──────────────┘
 */

import { GroqProvider, getGroqProvider, type OODAAnalysisRequest, type OODAAnalysisResponse } from '../llm';
import type { AgentConfig } from '../types';

// ─── Types ──────────────────────────────────────────────────────

export interface OODABridgeConfig {
  /** Groq API key (required for LLM calls) */
  groqApiKey: string;
  /** Selected model ID from the model selector */
  modelId: string;
  /** Temperature for LLM responses */
  temperature?: number;
  /** Maximum tokens for LLM responses */
  maxTokens?: number;
  /** Enable verbose logging */
  debug?: boolean;
}

export interface SelfImproveRequest {
  /** User's description of the issue */
  issue: string;
  /** Category of the issue */
  category: 'ui_bug' | 'logic_error' | 'performance' | 'style' | 'accessibility';
  /** File contents gathered by self_* tools */
  fileContents: Record<string, string>;
  /** Affected file paths */
  affectedFiles: string[];
  /** Additional context from previous analysis */
  context?: string;
}

export interface SelfImproveResult {
  /** Whether the improvement cycle completed successfully */
  success: boolean;
  /** The OODA cycle ID */
  cycleId: string;
  /** Current phase when result was generated */
  phase: string;
  /** LLM analysis from each phase */
  analyses: {
    observe?: OODAAnalysisResponse;
    orient?: OODAAnalysisResponse;
    decide?: OODAAnalysisResponse;
  };
  /** Proposed fixes from the DECIDE phase */
  proposedFixes: Array<{
    filePath: string;
    type: 'edit' | 'rewrite';
    oldStr?: string;
    newStr?: string;
    content?: string;
    explanation: string;
  }>;
  /** Error message if the cycle failed */
  error?: string;
  /** Token usage for this cycle */
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type BridgeEventType =
  | 'phase_start'
  | 'phase_complete'
  | 'llm_request'
  | 'llm_response'
  | 'fix_proposed'
  | 'fix_applied'
  | 'verification_result'
  | 'pattern_learned'
  | 'error';

export interface BridgeEvent {
  type: BridgeEventType;
  phase?: string;
  data?: unknown;
  timestamp: number;
}

export type BridgeEventHandler = (event: BridgeEvent) => void;

// ─── Protected Paths ────────────────────────────────────────────

const PROTECTED_PATHS = [
  'lib/agent/safety/',
  'lib/agent/constants.ts',
  '.env',
  '.env.local',
  '.env.production',
];

function isProtectedPath(filePath: string): boolean {
  return PROTECTED_PATHS.some(
    p => filePath.startsWith(p) || filePath === p
  );
}

// ─── OODA Bridge Class ──────────────────────────────────────────

export class OODABridge {
  private groq: GroqProvider;
  private config: OODABridgeConfig;
  private eventHandlers: Set<BridgeEventHandler> = new Set();
  private activeCycles: Map<string, SelfImproveResult> = new Map();
  private cycleCounter = 0;

  constructor(config: OODABridgeConfig) {
    this.config = config;
    this.groq = getGroqProvider({
      apiKey: config.groqApiKey,
      defaultModel: config.modelId,
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 8192,
    });
  }

  // ─── Configuration ───────────────────────────────────────────

  updateConfig(config: Partial<OODABridgeConfig>): void {
    if (config.groqApiKey) this.groq.setApiKey(config.groqApiKey);
    if (config.modelId) this.groq.setModel(config.modelId);
    if (config.temperature !== undefined) this.groq.setTemperature(config.temperature);
    Object.assign(this.config, config);
  }

  /** Sync settings from AgentService config (provider-agnostic) */
  syncFromAgentConfig(agentConfig: AgentConfig): void {
    if (agentConfig.provider === 'groq' && agentConfig.apiKey) {
      this.updateConfig({
        groqApiKey: agentConfig.apiKey,
        modelId: agentConfig.model,
        temperature: agentConfig.temperature,
      });
    }
  }

  isReady(): boolean {
    return this.groq.isConfigured();
  }

  getModel(): string {
    return this.groq.getModel();
  }

  // ─── Event System ───────────────────────────────────────────

  onEvent(handler: BridgeEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: Omit<BridgeEvent, 'timestamp'>): void {
    const fullEvent: BridgeEvent = { ...event, timestamp: Date.now() };
    this.eventHandlers.forEach(h => h(fullEvent));
    if (this.config.debug) {
      console.log(`[OODABridge] ${event.type}`, event.phase || '', event.data || '');
    }
  }

  // ─── Main: Run Self-Improve Cycle ───────────────────────────

  /**
   * Execute a full OODA self-improvement cycle:
   * OBSERVE → ORIENT → DECIDE
   *
   * Returns the analysis and proposed fixes WITHOUT executing them.
   * The AgentService decides whether to proceed with execution
   * based on risk level and user approval.
   */
  async runAnalysisCycle(request: SelfImproveRequest): Promise<SelfImproveResult> {
    const cycleId = `ooda-${++this.cycleCounter}-${Date.now()}`;

    // Validate inputs
    const protectedFiles = request.affectedFiles.filter(isProtectedPath);
    if (protectedFiles.length > 0) {
      return {
        success: false,
        cycleId,
        phase: 'BLOCKED',
        analyses: {},
        proposedFixes: [],
        error: `ملفات محمية لا يمكن تعديلها: ${protectedFiles.join(', ')}`,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    }

    if (request.affectedFiles.length > 10) {
      return {
        success: false,
        cycleId,
        phase: 'BLOCKED',
        analyses: {},
        proposedFixes: [],
        error: `عدد الملفات (${request.affectedFiles.length}) يتجاوز الحد الأقصى (10)`,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    }

    if (!this.isReady()) {
      return {
        success: false,
        cycleId,
        phase: 'BLOCKED',
        analyses: {},
        proposedFixes: [],
        error: 'مفتاح Groq API غير مكوّن. يرجى إضافته في الإعدادات.',
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    }

    const result: SelfImproveResult = {
      success: false,
      cycleId,
      phase: 'OBSERVE',
      analyses: {},
      proposedFixes: [],
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };

    this.activeCycles.set(cycleId, result);
    const usageBefore = this.groq.getUsageStats();

    try {
      // ═══ Phase 1: OBSERVE ═══════════════════════════════════
      this.emit({ type: 'phase_start', phase: 'OBSERVE' });
      this.emit({ type: 'llm_request', phase: 'OBSERVE', data: { issue: request.issue } });

      const observeResult = await this.groq.analyzeForOODA({
        phase: 'observe',
        issue: request.issue,
        fileContents: request.fileContents,
        context: request.context,
      });

      result.analyses.observe = observeResult;
      result.phase = 'ORIENT';
      this.emit({ type: 'llm_response', phase: 'OBSERVE', data: observeResult });
      this.emit({ type: 'phase_complete', phase: 'OBSERVE' });

      // ═══ Phase 2: ORIENT ════════════════════════════════════
      this.emit({ type: 'phase_start', phase: 'ORIENT' });
      this.emit({ type: 'llm_request', phase: 'ORIENT' });

      const orientResult = await this.groq.analyzeForOODA({
        phase: 'orient',
        issue: request.issue,
        fileContents: request.fileContents,
        context: `نتائج الرصد: ${observeResult.analysis}\n\nملاحظات: ${observeResult.suggestions.join(', ')}`,
      });

      result.analyses.orient = orientResult;
      result.phase = 'DECIDE';
      this.emit({ type: 'llm_response', phase: 'ORIENT', data: orientResult });
      this.emit({ type: 'phase_complete', phase: 'ORIENT' });

      // ═══ Phase 3: DECIDE ════════════════════════════════════
      this.emit({ type: 'phase_start', phase: 'DECIDE' });
      this.emit({ type: 'llm_request', phase: 'DECIDE' });

      const decideResult = await this.groq.analyzeForOODA({
        phase: 'decide',
        issue: request.issue,
        fileContents: request.fileContents,
        context: [
          `نتائج الرصد: ${observeResult.analysis}`,
          `التحليل: ${orientResult.analysis}`,
          `الاقتراحات: ${orientResult.suggestions.join(', ')}`,
        ].join('\n\n'),
      });

      result.analyses.decide = decideResult;
      result.phase = 'READY';
      this.emit({ type: 'llm_response', phase: 'DECIDE', data: decideResult });
      this.emit({ type: 'phase_complete', phase: 'DECIDE' });

      // Extract fixes from DECIDE response
      if (decideResult.fixes && decideResult.fixes.length > 0) {
        // Filter out any fixes targeting protected paths
        result.proposedFixes = decideResult.fixes.filter(
          fix => !isProtectedPath(fix.filePath)
        );
        this.emit({ type: 'fix_proposed', data: result.proposedFixes });
      }

      result.success = true;

    } catch (error) {
      result.error = (error as Error).message;
      result.phase = 'ERROR';
      this.emit({ type: 'error', data: { error: (error as Error).message } });
    }

    // Calculate token usage for this cycle
    const usageAfter = this.groq.getUsageStats();
    result.tokenUsage = {
      promptTokens: usageAfter.totalPromptTokens - usageBefore.totalPromptTokens,
      completionTokens: usageAfter.totalCompletionTokens - usageBefore.totalCompletionTokens,
      totalTokens: usageAfter.totalTokens - usageBefore.totalTokens,
    };

    this.activeCycles.set(cycleId, result);
    return result;
  }

  // ─── Cycle Management ───────────────────────────────────────

  getCycle(cycleId: string): SelfImproveResult | undefined {
    return this.activeCycles.get(cycleId);
  }

  getAllCycles(): Map<string, SelfImproveResult> {
    return new Map(this.activeCycles);
  }

  getActiveCycleCount(): number {
    return [...this.activeCycles.values()].filter(
      c => !['READY', 'COMPLETE', 'ERROR', 'BLOCKED'].includes(c.phase)
    ).length;
  }

  // ─── Quick Ask (for simple agent queries) ───────────────────

  /**
   * Quick LLM call for non-OODA tasks.
   * Used when AgentService needs Groq for general responses.
   */
  async ask(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error('مفتاح Groq API غير مكوّن');
    }
    return this.groq.ask(prompt, systemPrompt);
  }

  /**
   * Streaming chat for real-time UI responses.
   */
  async *chatStream(
    prompt: string,
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isReady()) {
      throw new Error('مفتاح Groq API غير مكوّن');
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system' as const, content: systemPrompt });
    messages.push({ role: 'user' as const, content: prompt });

    yield* this.groq.chatStream(messages);
  }

  // ─── Stats ─────────────────────────────────────────────────

  getStats(): {
    totalCycles: number;
    activeCycles: number;
    successfulCycles: number;
    failedCycles: number;
    totalTokens: number;
    model: string;
    isReady: boolean;
  } {
    const cycles = [...this.activeCycles.values()];
    return {
      totalCycles: cycles.length,
      activeCycles: this.getActiveCycleCount(),
      successfulCycles: cycles.filter(c => c.success).length,
      failedCycles: cycles.filter(c => c.phase === 'ERROR').length,
      totalTokens: this.groq.getUsageStats().totalTokens,
      model: this.groq.getModel(),
      isReady: this.isReady(),
    };
  }

  // ─── Cleanup ───────────────────────────────────────────────

  dispose(): void {
    this.eventHandlers.clear();
    this.activeCycles.clear();
  }
}

// ─── Singleton ──────────────────────────────────────────────────

let bridgeInstance: OODABridge | null = null;

export function getOODABridge(config?: OODABridgeConfig): OODABridge {
  if (!bridgeInstance && config) {
    bridgeInstance = new OODABridge(config);
  }
  if (!bridgeInstance) {
    bridgeInstance = new OODABridge({ groqApiKey: '', modelId: 'llama-3.3-70b-versatile' });
  }
  return bridgeInstance;
}

export function resetOODABridge(): void {
  bridgeInstance?.dispose();
  bridgeInstance = null;
}
