/**
 * CodeForge IDE — Self-Improve Connector v1.0
 * Bridge layer between the React UI panel (self-improve-panel.tsx)
 * and the OODA engine (ooda-controller.ts).
 *
 * This connector:
 * - Converts OODA events into UI-friendly format
 * - Manages active cycle state for the panel
 * - Provides Arabic labels and status descriptions
 * - Handles cleanup on unmount
 */

import type {
  OODAController,
  OODACycle,
  OODAPhase,
  OODAEvent,
} from './ooda-controller';
import type { LearningMemory, LearnedPattern } from './learning-memory';

// ═══════════════════════════════════════════════════════════════
// Types — UI-friendly data structures for the panel
// ═══════════════════════════════════════════════════════════════

/** Phase info with Arabic labels for the UI */
export interface UIPhase {
  id: OODAPhase;
  label: string;
  labelAr: string;
  icon: string;
  active: boolean;
  completed: boolean;
  timestamp?: number;
}

/** Timeline event for the activity feed */
export interface UITimelineEvent {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'phase';
  icon: string;
  message: string;
  messageAr: string;
  details?: string;
}

/** Task card data for the panel */
export interface UITaskCard {
  cycleId: string;
  title: string;
  titleAr: string;
  category: string;
  categoryAr: string;
  startedAt: number;
  elapsedMs: number;
  currentPhase: UIPhase;
  phases: UIPhase[];
  filesAnalyzed: string[];
  filesModified: string[];
  fixAttempts: number;
  maxAttempts: number;
  expanded: boolean;
}

/** Stats summary for the stats tab */
export interface UIStats {
  totalCycles: number;
  successfulCycles: number;
  failedCycles: number;
  activeCycles: number;
  totalFilesModified: number;
  totalPatternsLearned: number;
  avgCycleTimeMs: number;
  categoryBreakdown: Record<string, number>;
  topModifiedFiles: Array<{ path: string; count: number }>;
}

/** Connector state pushed to React */
export interface ConnectorState {
  activeTask: UITaskCard | null;
  timeline: UITimelineEvent[];
  stats: UIStats;
  patterns: LearnedPattern[];
  isRunning: boolean;
}

/** Callback type for state updates */
export type StateUpdateCallback = (state: ConnectorState) => void;

// ═══════════════════════════════════════════════════════════════
// Constants — Arabic labels and mappings
// ═══════════════════════════════════════════════════════════════

const PHASE_CONFIG: Record<
  OODAPhase,
  { label: string; labelAr: string; icon: string }
> = {
  observe: { label: 'Observe', labelAr: 'رصد', icon: '👁️' },
  orient: { label: 'Orient', labelAr: 'تحليل', icon: '🧭' },
  decide: { label: 'Decide', labelAr: 'قرار', icon: '📋' },
  act: { label: 'Act', labelAr: 'تنفيذ', icon: '⚡' },
  verify: { label: 'Verify', labelAr: 'تحقق', icon: '✅' },
};

const PHASE_ORDER: OODAPhase[] = [
  'observe',
  'orient',
  'decide',
  'act',
  'verify',
];

const CATEGORY_LABELS: Record<string, string> = {
  ui_bug: 'خلل واجهة',
  logic_error: 'خطأ منطقي',
  performance: 'أداء',
  style: 'تنسيق',
  accessibility: 'إتاحة',
};

// ═══════════════════════════════════════════════════════════════
// SelfImproveConnector
// ═══════════════════════════════════════════════════════════════

export class SelfImproveConnector {
  private controller: OODAController;
  private memory: LearningMemory;
  private listeners: Set<StateUpdateCallback> = new Set();
  private timeline: UITimelineEvent[] = [];
  private activeTask: UITaskCard | null = null;
  private completedCycleIds: Set<string> = new Set();
  private eventCounter = 0;
  private disposed = false;

  // Bound event handler references for cleanup
  private boundHandlers: Map<string, (event: OODAEvent) => void> = new Map();

  constructor(controller: OODAController, memory: LearningMemory) {
    this.controller = controller;
    this.memory = memory;
    this.setupEventListeners();
  }

  // ─── Event Listeners ─────────────────────────────────────────

  private setupEventListeners(): void {
    const events: Array<{ name: string; handler: (event: OODAEvent) => void }> =
      [
        { name: 'cycle:started', handler: (e) => this.onCycleStarted(e) },
        { name: 'phase:changed', handler: (e) => this.onPhaseChanged(e) },
        { name: 'fix:applied', handler: (e) => this.onFixApplied(e) },
        { name: 'fix:failed', handler: (e) => this.onFixFailed(e) },
        { name: 'verify:passed', handler: (e) => this.onVerifyPassed(e) },
        { name: 'verify:failed', handler: (e) => this.onVerifyFailed(e) },
        { name: 'cycle:completed', handler: (e) => this.onCycleCompleted(e) },
        { name: 'cycle:failed', handler: (e) => this.onCycleFailed(e) },
        { name: 'cycle:cancelled', handler: (e) => this.onCycleCancelled(e) },
        { name: 'pattern:learned', handler: (e) => this.onPatternLearned(e) },
      ];

    for (const { name, handler } of events) {
      this.boundHandlers.set(name, handler);
      this.controller.on(name, handler);
    }
  }

  // ─── Event Handlers ──────────────────────────────────────────

  private onCycleStarted(event: OODAEvent): void {
    const cycle = event.data as OODACycle;
    this.activeTask = this.buildTaskCard(cycle);
    this.addTimelineEvent(
      'phase',
      '🚀',
      'Improvement cycle started',
      'بدأت دورة التحسين',
      cycle.issue
    );
    this.notifyListeners();
  }

  private onPhaseChanged(event: OODAEvent): void {
    const { phase, cycleId } = event.data as {
      phase: OODAPhase;
      cycleId: string;
    };
    if (this.activeTask?.cycleId === cycleId) {
      this.updateTaskPhases(phase);
      const config = PHASE_CONFIG[phase];
      this.addTimelineEvent(
        'phase',
        config.icon,
        `Phase: ${config.label}`,
        `المرحلة: ${config.labelAr}`
      );
      this.notifyListeners();
    }
  }

  private onFixApplied(event: OODAEvent): void {
    const { filePath, type } = event.data as { filePath: string; type: string };
    if (this.activeTask) {
      if (!this.activeTask.filesModified.includes(filePath)) {
        this.activeTask.filesModified.push(filePath);
      }
      this.activeTask.fixAttempts++;
    }
    const shortPath = filePath.split('/').slice(-2).join('/');
    this.addTimelineEvent(
      'success',
      '🔧',
      `Fix applied: ${shortPath} (${type})`,
      `تم الإصلاح: ${shortPath} (${type === 'edit' ? 'تعديل' : 'إعادة كتابة'})`
    );
    this.notifyListeners();
  }

  private onFixFailed(event: OODAEvent): void {
    const { filePath, error } = event.data as {
      filePath: string;
      error: string;
    };
    const shortPath = filePath.split('/').slice(-2).join('/');
    this.addTimelineEvent(
      'error',
      '❌',
      `Fix failed: ${shortPath}`,
      `فشل الإصلاح: ${shortPath}`,
      error
    );
    this.notifyListeners();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onVerifyPassed(event: OODAEvent): void {
    this.addTimelineEvent('success', '✅', 'Verification passed', 'نجح التحقق');
    this.notifyListeners();
  }

  private onVerifyFailed(event: OODAEvent): void {
    const { reason } = event.data as { reason: string };
    this.addTimelineEvent(
      'warning',
      '⚠️',
      'Verification failed',
      'فشل التحقق',
      reason
    );
    this.notifyListeners();
  }

  private onCycleCompleted(event: OODAEvent): void {
    const { cycleId } = event.data as { cycleId: string };
    this.completedCycleIds.add(cycleId);
    this.addTimelineEvent(
      'success',
      '🎉',
      'Cycle completed successfully',
      'اكتملت الدورة بنجاح'
    );
    this.activeTask = null;
    this.notifyListeners();
  }

  private onCycleFailed(event: OODAEvent): void {
    const { cycleId, reason } = event.data as {
      cycleId: string;
      reason: string;
    };
    this.completedCycleIds.add(cycleId);
    this.addTimelineEvent('error', '💥', 'Cycle failed', 'فشلت الدورة', reason);
    this.activeTask = null;
    this.notifyListeners();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onCycleCancelled(event: OODAEvent): void {
    this.addTimelineEvent(
      'warning',
      '🛑',
      'Cycle cancelled',
      'تم إلغاء الدورة'
    );
    this.activeTask = null;
    this.notifyListeners();
  }

  private onPatternLearned(event: OODAEvent): void {
    const { description } = event.data as { description: string };
    this.addTimelineEvent(
      'info',
      '🧠',
      'Pattern learned',
      'تم حفظ نمط جديد',
      description
    );
    this.notifyListeners();
  }

  // ─── Task Card Builder ───────────────────────────────────────

  private buildTaskCard(cycle: OODACycle): UITaskCard {
    const currentPhaseConfig = PHASE_CONFIG[cycle.currentPhase];
    return {
      cycleId: cycle.id,
      title: cycle.issue,
      titleAr: cycle.issue,
      category: cycle.category,
      categoryAr: CATEGORY_LABELS[cycle.category] || cycle.category,
      startedAt: cycle.startedAt,
      elapsedMs: Date.now() - cycle.startedAt,
      currentPhase: {
        id: cycle.currentPhase,
        label: currentPhaseConfig.label,
        labelAr: currentPhaseConfig.labelAr,
        icon: currentPhaseConfig.icon,
        active: true,
        completed: false,
      },
      phases: this.buildPhaseList(cycle.currentPhase, cycle.phaseHistory),
      filesAnalyzed: cycle.affectedFiles || [],
      filesModified: cycle.modifiedFiles || [],
      fixAttempts: cycle.fixAttempts || 0,
      maxAttempts: 5,
      expanded: true,
    };
  }

  private buildPhaseList(
    currentPhase: OODAPhase,
    phaseHistory?: Array<{ phase: OODAPhase; timestamp: number }>
  ): UIPhase[] {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    const historyMap = new Map<string, number>();
    if (phaseHistory) {
      for (const entry of phaseHistory) {
        historyMap.set(entry.phase, entry.timestamp);
      }
    }

    return PHASE_ORDER.map((phase, index) => {
      const config = PHASE_CONFIG[phase];
      return {
        id: phase,
        label: config.label,
        labelAr: config.labelAr,
        icon: config.icon,
        active: index === currentIndex,
        completed: index < currentIndex,
        timestamp: historyMap.get(phase),
      };
    });
  }

  private updateTaskPhases(newPhase: OODAPhase): void {
    if (!this.activeTask) return;
    const config = PHASE_CONFIG[newPhase];
    this.activeTask.currentPhase = {
      id: newPhase,
      label: config.label,
      labelAr: config.labelAr,
      icon: config.icon,
      active: true,
      completed: false,
    };
    this.activeTask.phases = this.buildPhaseList(newPhase);
    this.activeTask.elapsedMs = Date.now() - this.activeTask.startedAt;
  }

  // ─── Timeline Manager ───────────────────────────────────────

  private addTimelineEvent(
    type: UITimelineEvent['type'],
    icon: string,
    message: string,
    messageAr: string,
    details?: string
  ): void {
    this.eventCounter++;
    const event: UITimelineEvent = {
      id: `evt-${this.eventCounter}-${Date.now()}`,
      timestamp: Date.now(),
      type,
      icon,
      message,
      messageAr,
      details,
    };
    this.timeline.push(event);

    // Keep timeline manageable (max 200 events)
    if (this.timeline.length > 200) {
      this.timeline = this.timeline.slice(-150);
    }
  }

  // ─── Stats Builder ──────────────────────────────────────────

  private buildStats(): UIStats {
    const status = this.controller.getStatus();
    const allPatterns = this.memory.getAllPatterns();

    // Calculate category breakdown from patterns
    const categoryBreakdown: Record<string, number> = {};
    for (const pattern of allPatterns) {
      for (const tag of pattern.tags) {
        categoryBreakdown[tag] = (categoryBreakdown[tag] || 0) + 1;
      }
    }

    // Build top modified files from timeline
    const fileModCounts = new Map<string, number>();
    for (const event of this.timeline) {
      if (
        event.type === 'success' &&
        event.message.startsWith('Fix applied:')
      ) {
        const match = event.message.match(/Fix applied: (.+?) \(/);
        if (match) {
          const path = match[1];
          fileModCounts.set(path, (fileModCounts.get(path) || 0) + 1);
        }
      }
    }
    const topModifiedFiles = Array.from(fileModCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalCycles:
        status.totalCompleted + status.totalFailed + status.activeCount,
      successfulCycles: status.totalCompleted,
      failedCycles: status.totalFailed,
      activeCycles: status.activeCount,
      totalFilesModified: this.activeTask?.filesModified.length || 0,
      totalPatternsLearned: allPatterns.length,
      avgCycleTimeMs: status.avgCycleTimeMs || 0,
      categoryBreakdown,
      topModifiedFiles,
    };
  }

  // ─── Public API ─────────────────────────────────────────────

  /** Subscribe to state updates */
  subscribe(callback: StateUpdateCallback): () => void {
    this.listeners.add(callback);
    // Send initial state immediately
    callback(this.getState());
    return () => {
      this.listeners.delete(callback);
    };
  }

  /** Get current state snapshot */
  getState(): ConnectorState {
    // Update elapsed time if task is active
    if (this.activeTask) {
      this.activeTask.elapsedMs = Date.now() - this.activeTask.startedAt;
    }

    return {
      activeTask: this.activeTask,
      timeline: [...this.timeline],
      stats: this.buildStats(),
      patterns: this.memory.getAllPatterns(),
      isRunning: this.activeTask !== null,
    };
  }

  /** Start a new improvement cycle from the UI */
  async startImprovement(
    issue: string,
    category: string,
    affectedFiles: string[]
  ): Promise<string> {
    const cycleId = await this.controller.startCycle({
      issue,
      category: category as
        | 'ui_bug'
        | 'logic_error'
        | 'performance'
        | 'style'
        | 'accessibility',
      affectedFiles,
    });
    return cycleId;
  }

  /** Cancel the active cycle */
  async cancelCycle(cycleId: string): Promise<void> {
    await this.controller.cancelCycle(cycleId);
  }

  /** Get stats for the stats tab */
  getStats(): UIStats {
    return this.buildStats();
  }

  /** Get all learned patterns for the memory tab */
  getPatterns(): LearnedPattern[] {
    return this.memory.getAllPatterns();
  }

  /** Search patterns by similarity */
  searchPatterns(query: string): LearnedPattern[] {
    return this.memory.searchPatterns(query);
  }

  /** Get timeline events (optionally filtered) */
  getTimeline(filter?: UITimelineEvent['type']): UITimelineEvent[] {
    if (!filter) return [...this.timeline];
    return this.timeline.filter((e) => e.type === filter);
  }

  /** Clear timeline history */
  clearTimeline(): void {
    this.timeline = [];
    this.notifyListeners();
  }

  // ─── Notification ───────────────────────────────────────────

  private notifyListeners(): void {
    if (this.disposed) return;
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('[SelfImproveConnector] Listener error:', err);
      }
    }
  }

  // ─── Cleanup ────────────────────────────────────────────────

  /** Dispose the connector and remove all event listeners */
  dispose(): void {
    this.disposed = true;
    for (const [name, handler] of this.boundHandlers) {
      this.controller.off(name, handler);
    }
    this.boundHandlers.clear();
    this.listeners.clear();
    this.timeline = [];
    this.activeTask = null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Factory — create a connector from existing instances
// ═══════════════════════════════════════════════════════════════

export function createSelfImproveConnector(
  controller: OODAController,
  memory: LearningMemory
): SelfImproveConnector {
  return new SelfImproveConnector(controller, memory);
}
