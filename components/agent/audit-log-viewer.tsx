'use client';

/**
 * CodeForge IDE — Audit Log Viewer
 * React component for browsing, filtering, and exporting agent audit logs.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { getAuditLogger, type AuditLogEntryEnhanced, type AuditLogStats } from '@/lib/agent/audit-logger';

// ─── Risk Level Badge ─────────────────────────────────────────

function RiskBadge({ level }: { level?: string }) {
  const colors: Record<string, string> = {
    auto: 'bg-green-500/20 text-green-400',
    notify: 'bg-yellow-500/20 text-yellow-400',
    confirm: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono ${colors[level || 'auto'] || colors.auto}`}>
      {level || 'auto'}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────

function StatusBadge({ entry }: { entry: AuditLogEntryEnhanced }) {
  if (!entry.approved) {
    return <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">مرفوض</span>;
  }
  if (entry.result?.success) {
    return <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">نجح ✓</span>;
  }
  if (entry.result && !entry.result.success) {
    return <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">فشل ✗</span>;
  }
  return <span className="px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-400">—</span>;
}

// ─── Stats Panel ──────────────────────────────────────────────

function StatsPanel({ stats }: { stats: AuditLogStats }) {
  const successRate = stats.totalOperations > 0
    ? Math.round((stats.successCount / stats.totalOperations) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div className="bg-[#1e1e2e] rounded-lg p-3 border border-[#313244]">
        <div className="text-2xl font-bold text-white">{stats.totalOperations}</div>
        <div className="text-xs text-gray-400">إجمالي العمليات</div>
      </div>
      <div className="bg-[#1e1e2e] rounded-lg p-3 border border-[#313244]">
        <div className="text-2xl font-bold text-green-400">{successRate}%</div>
        <div className="text-xs text-gray-400">نسبة النجاح</div>
      </div>
      <div className="bg-[#1e1e2e] rounded-lg p-3 border border-[#313244]">
        <div className="text-2xl font-bold text-yellow-400">{stats.rejectedCount}</div>
        <div className="text-xs text-gray-400">مرفوضة</div>
      </div>
      <div className="bg-[#1e1e2e] rounded-lg p-3 border border-[#313244]">
        <div className="text-2xl font-bold text-blue-400">{stats.averageDuration}ms</div>
        <div className="text-xs text-gray-400">متوسط المدة</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function AuditLogViewer() {
  const logger = getAuditLogger();
  const [entries, setEntries] = useState<AuditLogEntryEnhanced[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [filterTool, setFilterTool] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('');
  const [filterSuccess, setFilterSuccess] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);

  // Load and subscribe
  useEffect(() => {
    const refresh = () => {
      setEntries(logger.getAll());
      setStats(logger.getStats());
    };
    refresh();
    return logger.subscribe(refresh);
  }, []);

  // Get unique tool names for filter dropdown
  const toolNames = useMemo(() => {
    const names = new Set(entries.map((e) => e.toolName));
    return Array.from(names).sort();
  }, [entries]);

  // Apply filters
  const filteredEntries = useMemo(() => {
    return logger.filter({
      toolName: filterTool || undefined,
      riskLevel: (filterRisk as 'auto' | 'notify' | 'confirm') || undefined,
      success: filterSuccess === '' ? undefined : filterSuccess === 'true',
      searchQuery: searchQuery || undefined,
    });
  }, [entries, filterTool, filterRisk, filterSuccess, searchQuery]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#11111b] text-white p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          📋 سجل العمليات (Audit Log)
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-3 py-1 text-xs rounded bg-[#313244] hover:bg-[#45475a] transition-colors"
          >
            {showStats ? 'إخفاء الإحصائيات' : 'إظهار الإحصائيات'}
          </button>
          <button
            onClick={() => logger.downloadExport('json')}
            className="px-3 py-1 text-xs rounded bg-blue-600/30 text-blue-400 hover:bg-blue-600/50 transition-colors"
          >
            📥 JSON
          </button>
          <button
            onClick={() => logger.downloadExport('csv')}
            className="px-3 py-1 text-xs rounded bg-green-600/30 text-green-400 hover:bg-green-600/50 transition-colors"
          >
            📥 CSV
          </button>
          <button
            onClick={() => { if (confirm('هل أنت متأكد من حذف كل السجلات؟')) logger.clear(); }}
            className="px-3 py-1 text-xs rounded bg-red-600/30 text-red-400 hover:bg-red-600/50 transition-colors"
          >
            🗑️ مسح
          </button>
        </div>
      </div>

      {/* Stats */}
      {showStats && stats && <StatsPanel stats={stats} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="🔍 بحث..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[150px] px-3 py-1.5 text-sm bg-[#1e1e2e] border border-[#313244] rounded focus:border-blue-500 focus:outline-none"
        />
        <select
          value={filterTool}
          onChange={(e) => setFilterTool(e.target.value)}
          className="px-2 py-1.5 text-sm bg-[#1e1e2e] border border-[#313244] rounded"
        >
          <option value="">كل الأدوات</option>
          {toolNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="px-2 py-1.5 text-sm bg-[#1e1e2e] border border-[#313244] rounded"
        >
          <option value="">كل المستويات</option>
          <option value="auto">🟢 auto</option>
          <option value="notify">🟡 notify</option>
          <option value="confirm">🔴 confirm</option>
        </select>
        <select
          value={filterSuccess}
          onChange={(e) => setFilterSuccess(e.target.value)}
          className="px-2 py-1.5 text-sm bg-[#1e1e2e] border border-[#313244] rounded"
        >
          <option value="">كل النتائج</option>
          <option value="true">✓ ناجح</option>
          <option value="false">✗ فاشل</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500 mb-2">
        عرض {filteredEntries.length} من {entries.length} عملية
      </div>

      {/* Entries List */}
      <div className="flex-1 space-y-1">
        {filteredEntries.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-4xl mb-2">📋</div>
            <div>لا توجد عمليات مسجلة بعد</div>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-[#1e1e2e] border border-[#313244] rounded-lg overflow-hidden hover:border-[#45475a] transition-colors cursor-pointer"
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              {/* Row Summary */}
              <div className="flex items-center gap-3 px-3 py-2">
                <span className="text-xs text-gray-500 font-mono w-[110px] shrink-0">
                  {formatTime(entry.timestamp)}
                </span>
                <span className="font-mono text-sm text-blue-400 w-[200px] shrink-0 truncate">
                  {entry.toolName}
                </span>
                <span className="text-xs text-gray-400 flex-1 truncate">
                  {entry.summary}
                </span>
                <RiskBadge level={entry.riskLevel} />
                <StatusBadge entry={entry} />
                {entry.duration && (
                  <span className="text-xs text-gray-500 w-[60px] text-right">
                    {entry.duration}ms
                  </span>
                )}
              </div>

              {/* Expanded Details */}
              {expandedId === entry.id && (
                <div className="border-t border-[#313244] px-3 py-2 bg-[#181825] text-xs">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div><span className="text-gray-500">ID:</span> <span className="font-mono">{entry.id.slice(0, 8)}</span></div>
                    <div><span className="text-gray-500">Session:</span> <span className="font-mono">{entry.sessionId}</span></div>
                    <div><span className="text-gray-500">Category:</span> {entry.category}</div>
                    <div><span className="text-gray-500">Approved by:</span> {entry.approvedBy}</div>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-500">Arguments:</span>
                    <pre className="mt-1 p-2 bg-[#11111b] rounded overflow-x-auto text-green-300">
                      {JSON.stringify(entry.args, null, 2)}
                    </pre>
                  </div>
                  {entry.result && (
                    <div>
                      <span className="text-gray-500">Result:</span>
                      <pre className={`mt-1 p-2 bg-[#11111b] rounded overflow-x-auto ${entry.result.success ? 'text-green-300' : 'text-red-300'}`}>
                        {JSON.stringify(entry.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AuditLogViewer;
