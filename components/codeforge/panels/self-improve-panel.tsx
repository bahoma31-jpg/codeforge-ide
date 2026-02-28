/**
 * CodeForge IDE — Self-Improvement Panel
 * Real-time monitoring UI for OODA loop tasks.
 *
 * Features:
 * - Live task status with phase indicators (Observe → Orient → Decide → Act → Verify)
 * - Timeline of events with timestamps
 * - Task history with success/failure stats
 * - Learning memory insights
 * - Quick actions: start improvement, cancel task, view suggestions
 *
 * Subscribes to OODAController events for real-time updates.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './self-improve-panel.css';

// ─── Types ────────────────────────────────────────────────────

interface OODAEvent {
  phase: string;
  type: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

interface TaskInfo {
  id: string;
  description: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentPhase: string;
  startedAt: number;
  completedAt?: number;
  events: OODAEvent[];
  filesModified: string[];
  iterations: number;
  maxIterations: number;
}

interface LearningPattern {
  category: string;
  successRate: number;
  totalUses: number;
  lastUsed: number;
  description: string;
}

interface SelfImproveStats {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  totalFilesModified: number;
  averageIterations: number;
  topCategories: Array<{ category: string; count: number }>;
  topFiles: Array<{ file: string; count: number }>;
}

// ─── Phase Indicator Component ────────────────────────────────

const PHASES = [
  { key: 'observe', icon: '👁️', label: 'Observe', labelAr: 'رصد' },
  { key: 'orient', icon: '🧭', label: 'Orient', labelAr: 'تحليل' },
  { key: 'decide', icon: '📋', label: 'Decide', labelAr: 'قرار' },
  { key: 'act', icon: '⚡', label: 'Act', labelAr: 'تنفيذ' },
  { key: 'verify', icon: '✅', label: 'Verify', labelAr: 'تحقق' },
];

function PhaseIndicator({ currentPhase }: { currentPhase: string }) {
  const currentIndex = PHASES.findIndex((p) => p.key === currentPhase);

  return (
    <div className="si-phase-indicator">
      {PHASES.map((phase, index) => {
        let status = 'pending';
        if (index < currentIndex) status = 'completed';
        if (index === currentIndex) status = 'active';

        return (
          <React.Fragment key={phase.key}>
            <div className={`si-phase-step si-phase-${status}`}>
              <span className="si-phase-icon">{phase.icon}</span>
              <span className="si-phase-label">{phase.labelAr}</span>
            </div>
            {index < PHASES.length - 1 && (
              <div
                className={`si-phase-connector ${
                  index < currentIndex ? 'si-connector-done' : ''
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Event Timeline Component ─────────────────────────────────

function EventTimeline({ events }: { events: OODAEvent[] }) {
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="si-timeline-empty">
        <span className="si-timeline-empty-icon">📭</span>
        <p>لا توجد أحداث بعد</p>
      </div>
    );
  }

  return (
    <div className="si-timeline" ref={timelineRef}>
      {events.map((event, index) => {
        const time = new Date(event.timestamp).toLocaleTimeString('ar-DZ', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const phaseEmoji =
          PHASES.find((p) => p.key === event.phase)?.icon || '🔄';

        return (
          <div
            key={index}
            className={`si-timeline-event si-event-${event.type}`}
          >
            <div className="si-event-time">{time}</div>
            <div className="si-event-dot" />
            <div className="si-event-content">
              <span className="si-event-phase">{phaseEmoji}</span>
              <span className="si-event-message">{event.message}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Task Card Component ──────────────────────────────────────

function TaskCard({ task, isActive }: { task: TaskInfo; isActive: boolean }) {
  const [expanded, setExpanded] = useState(isActive);

  const duration = task.completedAt
    ? ((task.completedAt - task.startedAt) / 1000).toFixed(1)
    : ((Date.now() - task.startedAt) / 1000).toFixed(0);

  const statusIcon = {
    running: '🔄',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫',
  }[task.status];

  const statusLabel = {
    running: 'جارٍ',
    completed: 'مكتمل',
    failed: 'فشل',
    cancelled: 'ملغى',
  }[task.status];

  return (
    <div
      className={`si-task-card si-task-${task.status} ${isActive ? 'si-task-active' : ''}`}
    >
      <div
        className="si-task-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        <div className="si-task-title-row">
          <span className="si-task-status-icon">{statusIcon}</span>
          <span className="si-task-description">{task.description}</span>
          <span className="si-task-expand">{expanded ? '▲' : '▼'}</span>
        </div>
        <div className="si-task-meta">
          <span className="si-task-status-label">{statusLabel}</span>
          <span className="si-task-duration">{duration}s</span>
          <span className="si-task-iterations">
            {task.iterations}/{task.maxIterations} دورات
          </span>
          <span className="si-task-files">
            {task.filesModified.length} ملفات
          </span>
        </div>
      </div>

      {expanded && (
        <div className="si-task-body">
          {isActive && task.status === 'running' && (
            <PhaseIndicator currentPhase={task.currentPhase} />
          )}

          <EventTimeline events={task.events} />

          {task.filesModified.length > 0 && (
            <div className="si-task-files-list">
              <h4>الملفات المعدّلة:</h4>
              <ul>
                {task.filesModified.map((file, i) => (
                  <li key={i} className="si-file-item">
                    <span className="si-file-icon">📄</span>
                    <code>{file}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stats Dashboard Component ────────────────────────────────

function StatsDashboard({ stats }: { stats: SelfImproveStats }) {
  const successRate =
    stats.totalTasks > 0
      ? ((stats.successfulTasks / stats.totalTasks) * 100).toFixed(0)
      : '0';

  return (
    <div className="si-stats-dashboard">
      <div className="si-stats-grid">
        <div className="si-stat-card">
          <span className="si-stat-value">{stats.totalTasks}</span>
          <span className="si-stat-label">إجمالي المهام</span>
        </div>
        <div className="si-stat-card si-stat-success">
          <span className="si-stat-value">{successRate}%</span>
          <span className="si-stat-label">نسبة النجاح</span>
        </div>
        <div className="si-stat-card">
          <span className="si-stat-value">{stats.totalFilesModified}</span>
          <span className="si-stat-label">ملفات معدّلة</span>
        </div>
        <div className="si-stat-card">
          <span className="si-stat-value">
            {stats.averageIterations.toFixed(1)}
          </span>
          <span className="si-stat-label">متوسط الدورات</span>
        </div>
      </div>

      {stats.topCategories.length > 0 && (
        <div className="si-stats-section">
          <h4>أكثر الفئات:</h4>
          <div className="si-category-bars">
            {stats.topCategories.slice(0, 5).map((cat, i) => (
              <div key={i} className="si-category-bar">
                <span className="si-cat-name">{cat.category}</span>
                <div className="si-cat-bar-bg">
                  <div
                    className="si-cat-bar-fill"
                    style={{
                      width: `${Math.min(100, (cat.count / (stats.topCategories[0]?.count || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="si-cat-count">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.topFiles.length > 0 && (
        <div className="si-stats-section">
          <h4>أكثر الملفات تعديلاً:</h4>
          <ul className="si-top-files">
            {stats.topFiles.slice(0, 5).map((file, i) => (
              <li key={i}>
                <code>{file.file}</code>
                <span className="si-file-count">×{file.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main Panel Component ─────────────────────────────────────

type TabKey = 'active' | 'history' | 'stats' | 'memory';

export interface SelfImprovePanelProps {
  /** Subscribe to OODA events (returns unsubscribe fn) */
  onSubscribe?: (listener: (event: OODAEvent) => void) => () => void;
  /** Fetch current task info */
  getActiveTask?: () => TaskInfo | null;
  /** Fetch task history */
  getTaskHistory?: () => TaskInfo[];
  /** Fetch stats */
  getStats?: () => SelfImproveStats;
  /** Fetch learning patterns */
  getLearningPatterns?: () => LearningPattern[];
  /** Cancel active task */
  onCancelTask?: (taskId: string) => void;
  /** Start new improvement */
  onStartImprovement?: (description: string) => void;
  /** Panel visibility */
  isOpen: boolean;
  /** Toggle panel */
  onToggle: () => void;
}

export function SelfImprovePanel({
  onSubscribe,
  getActiveTask,
  getTaskHistory,
  getStats,
  getLearningPatterns,
  onCancelTask,
  onStartImprovement,
  isOpen,
  onToggle,
}: SelfImprovePanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [activeTask, setActiveTask] = useState<TaskInfo | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskInfo[]>([]);
  const [stats, setStats] = useState<SelfImproveStats | null>(null);
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to OODA events
  useEffect(() => {
    if (!onSubscribe) return;

    const unsubscribe = onSubscribe((event: OODAEvent) => {
      setActiveTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentPhase: event.phase,
          events: [...prev.events, event],
        };
      });
    });

    return unsubscribe;
  }, [onSubscribe]);

  // Refresh data when tab changes
  const refreshData = useCallback(() => {
    setIsRefreshing(true);

    if (getActiveTask) setActiveTask(getActiveTask());
    if (getTaskHistory) setTaskHistory(getTaskHistory());
    if (getStats) setStats(getStats());
    if (getLearningPatterns) setPatterns(getLearningPatterns());

    setTimeout(() => setIsRefreshing(false), 300);
  }, [getActiveTask, getTaskHistory, getStats, getLearningPatterns]);

  useEffect(() => {
    if (isOpen) refreshData();
  }, [isOpen, activeTab, refreshData]);

  // Handle new task submission
  const handleStartTask = useCallback(() => {
    if (!newTaskDesc.trim() || !onStartImprovement) return;
    onStartImprovement(newTaskDesc.trim());
    setNewTaskDesc('');
    setActiveTab('active');
  }, [newTaskDesc, onStartImprovement]);

  if (!isOpen) {
    return (
      <button
        className="si-panel-toggle si-panel-closed"
        onClick={onToggle}
        title="فتح لوحة التحسين الذاتي"
      >
        <span className="si-toggle-icon">🔄</span>
        {activeTask?.status === 'running' && (
          <span className="si-toggle-badge si-badge-active" />
        )}
      </button>
    );
  }

  return (
    <div className="si-panel">
      {/* Header */}
      <div className="si-panel-header">
        <div className="si-header-title">
          <span className="si-header-icon">🧠</span>
          <h3>التحسين الذاتي</h3>
          {activeTask?.status === 'running' && (
            <span className="si-header-badge">نشط</span>
          )}
        </div>
        <div className="si-header-actions">
          <button
            className="si-btn-refresh"
            onClick={refreshData}
            disabled={isRefreshing}
            title="تحديث"
          >
            <span className={isRefreshing ? 'si-spinning' : ''}>🔄</span>
          </button>
          <button className="si-btn-close" onClick={onToggle} title="إغلاق">
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="si-tabs">
        {[
          { key: 'active' as TabKey, label: 'نشط', icon: '⚡' },
          { key: 'history' as TabKey, label: 'السجل', icon: '📜' },
          { key: 'stats' as TabKey, label: 'إحصائيات', icon: '📊' },
          { key: 'memory' as TabKey, label: 'الذاكرة', icon: '🧠' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`si-tab ${activeTab === tab.key ? 'si-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="si-tab-icon">{tab.icon}</span>
            <span className="si-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="si-panel-content">
        {/* ─── Active Task Tab ─── */}
        {activeTab === 'active' && (
          <div className="si-tab-content">
            {activeTask && activeTask.status === 'running' ? (
              <>
                <TaskCard task={activeTask} isActive={true} />
                {onCancelTask && (
                  <button
                    className="si-btn-cancel"
                    onClick={() => onCancelTask(activeTask.id)}
                  >
                    🚫 إلغاء المهمة
                  </button>
                )}
              </>
            ) : (
              <div className="si-no-active">
                <span className="si-no-active-icon">💤</span>
                <p>لا توجد مهمة نشطة حالياً</p>
                {onStartImprovement && (
                  <div className="si-start-task">
                    <input
                      type="text"
                      className="si-input"
                      placeholder="وصف المشكلة أو التحسين..."
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleStartTask()}
                    />
                    <button
                      className="si-btn-start"
                      onClick={handleStartTask}
                      disabled={!newTaskDesc.trim()}
                    >
                      🚀 بدء التحسين
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── History Tab ─── */}
        {activeTab === 'history' && (
          <div className="si-tab-content">
            {taskHistory.length > 0 ? (
              <div className="si-history-list">
                {taskHistory.map((task) => (
                  <TaskCard key={task.id} task={task} isActive={false} />
                ))}
              </div>
            ) : (
              <div className="si-empty-state">
                <span className="si-empty-icon">📭</span>
                <p>لا توجد مهام سابقة</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Stats Tab ─── */}
        {activeTab === 'stats' && (
          <div className="si-tab-content">
            {stats ? (
              <StatsDashboard stats={stats} />
            ) : (
              <div className="si-empty-state">
                <span className="si-empty-icon">📊</span>
                <p>لا توجد بيانات كافية</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Learning Memory Tab ─── */}
        {activeTab === 'memory' && (
          <div className="si-tab-content">
            {patterns.length > 0 ? (
              <div className="si-patterns-list">
                {patterns.map((pattern, i) => (
                  <div key={i} className="si-pattern-card">
                    <div className="si-pattern-header">
                      <span className="si-pattern-category">
                        {pattern.category}
                      </span>
                      <span
                        className={`si-pattern-rate ${
                          pattern.successRate >= 0.7
                            ? 'si-rate-good'
                            : pattern.successRate >= 0.4
                              ? 'si-rate-mid'
                              : 'si-rate-low'
                        }`}
                      >
                        {(pattern.successRate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="si-pattern-desc">{pattern.description}</p>
                    <div className="si-pattern-meta">
                      <span>استخدام: {pattern.totalUses}×</span>
                      <span>
                        آخر:{' '}
                        {new Date(pattern.lastUsed).toLocaleDateString('ar-DZ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="si-empty-state">
                <span className="si-empty-icon">🧠</span>
                <p>لم يتعلم الوكيل أنماطاً بعد</p>
                <p className="si-empty-hint">
                  ستظهر الأنماط بعد إكمال أولى مهام التحسين
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SelfImprovePanel;
