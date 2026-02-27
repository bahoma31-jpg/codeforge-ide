'use client';

/**
 * CodeForge IDE — Enhanced Agent Panel (Phase 9)
 * Extends the agent chat panel with OODA status bar and mode indicator.
 *
 * This component wraps the existing agent-panel.tsx functionality
 * and adds a visual OODA integration layer on top.
 *
 * New features:
 * - Mode indicator (Chat / Self-Improve / Hybrid)
 * - OODA status bar with phase progress
 * - Quick toggle for OODA auto-detection
 * - Token usage display for OODA cycles
 */

import React, { useState, useCallback } from 'react';
import type { OODAMode, OODAAgentEvent } from '@/lib/agent/agent-service-ooda';
import {
  Brain,
  MessageSquare,
  RefreshCw,
  Zap,
  Eye,
  Compass,
  ClipboardList,
  Play,
  CheckCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

interface OODAStatusBarProps {
  mode: OODAMode;
  isOODAReady: boolean;
  autoDetect: boolean;
  onToggleAutoDetect: (enabled: boolean) => void;
  currentPhase?: string;
  tokenUsage?: number;
  lastEvent?: OODAAgentEvent;
}

interface OODAPhaseIndicatorProps {
  currentPhase: string;
}

// ─── Phase Icons & Labels ────────────────────────────────────────

const PHASE_CONFIG: Record<string, {
  icon: React.ReactNode;
  label: string;
  labelAr: string;
  color: string;
}> = {
  OBSERVE: {
    icon: <Eye size={12} />,
    label: 'Observe',
    labelAr: 'رصد',
    color: '#89b4fa',
  },
  ORIENT: {
    icon: <Compass size={12} />,
    label: 'Orient',
    labelAr: 'تحليل',
    color: '#cba6f7',
  },
  DECIDE: {
    icon: <ClipboardList size={12} />,
    label: 'Decide',
    labelAr: 'قرار',
    color: '#f9e2af',
  },
  ACT: {
    icon: <Play size={12} />,
    label: 'Act',
    labelAr: 'تنفيذ',
    color: '#fab387',
  },
  VERIFY: {
    icon: <CheckCircle size={12} />,
    label: 'Verify',
    labelAr: 'تحقق',
    color: '#a6e3a1',
  },
  READY: {
    icon: <CheckCircle size={12} />,
    label: 'Ready',
    labelAr: 'جاهز',
    color: '#a6e3a1',
  },
  ERROR: {
    icon: <AlertTriangle size={12} />,
    label: 'Error',
    labelAr: 'خطأ',
    color: '#f38ba8',
  },
};

const MODE_CONFIG: Record<OODAMode, {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
}> = {
  chat: {
    icon: <MessageSquare size={12} />,
    label: 'محادثة',
    color: '#89b4fa',
    bg: '#89b4fa',
  },
  'self-improve': {
    icon: <RefreshCw size={12} />,
    label: 'تحسين ذاتي',
    color: '#a6e3a1',
    bg: '#a6e3a1',
  },
  hybrid: {
    icon: <Zap size={12} />,
    label: 'هجين',
    color: '#cba6f7',
    bg: '#cba6f7',
  },
};

// ─── OODA Phase Indicator ────────────────────────────────────────

function OODAPhaseIndicator({ currentPhase }: OODAPhaseIndicatorProps) {
  const phases = ['OBSERVE', 'ORIENT', 'DECIDE', 'ACT', 'VERIFY'];
  const currentIdx = phases.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-1">
      {phases.map((phase, idx) => {
        const config = PHASE_CONFIG[phase];
        const isActive = idx === currentIdx;
        const isPast = idx < currentIdx;
        const opacity = isActive ? 1 : isPast ? 0.6 : 0.2;

        return (
          <React.Fragment key={phase}>
            <div
              className="flex items-center gap-0.5 transition-all duration-300"
              style={{ opacity }}
              title={`${config.labelAr} (${config.label})`}
            >
              <span style={{ color: config.color }}>{config.icon}</span>
              {isActive && (
                <span
                  className="text-[9px] font-medium"
                  style={{ color: config.color }}
                >
                  {config.labelAr}
                </span>
              )}
            </div>
            {idx < phases.length - 1 && (
              <div
                className="w-3 h-px transition-all duration-300"
                style={{
                  backgroundColor: isPast ? config.color : '#313244',
                  opacity: isPast ? 0.6 : 0.3,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── OODA Status Bar ─────────────────────────────────────────────

export function OODAStatusBar({
  mode,
  isOODAReady,
  autoDetect,
  onToggleAutoDetect,
  currentPhase,
  tokenUsage,
  lastEvent,
}: OODAStatusBarProps) {
  const modeConfig = MODE_CONFIG[mode];

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-[#11111b] border-b border-[#313244] text-[10px]">
      {/* Left: Mode indicator */}
      <div className="flex items-center gap-2">
        {/* Mode badge */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${modeConfig.bg}15`, color: modeConfig.color }}
        >
          {modeConfig.icon}
          <span className="font-medium">{modeConfig.label}</span>
        </div>

        {/* OODA readiness dot */}
        {isOODAReady ? (
          <div className="flex items-center gap-1 text-[#a6e3a1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a6e3a1] animate-pulse" />
            <span>OODA</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[#6c7086]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6c7086]" />
            <span>OODA غير مفعّل</span>
          </div>
        )}
      </div>

      {/* Center: Phase indicator (when in self-improve mode) */}
      {mode === 'self-improve' && currentPhase && (
        <OODAPhaseIndicator currentPhase={currentPhase} />
      )}

      {/* Right: Auto-detect toggle + tokens */}
      <div className="flex items-center gap-3">
        {/* Token usage */}
        {tokenUsage !== undefined && tokenUsage > 0 && (
          <span className="text-[#6c7086]">
            🪙 {tokenUsage.toLocaleString()}
          </span>
        )}

        {/* Auto-detect toggle */}
        <button
          onClick={() => onToggleAutoDetect(!autoDetect)}
          className="flex items-center gap-1 text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
          title={autoDetect ? 'الاكتشاف التلقائي مفعّل' : 'الاكتشاف التلقائي معطّل'}
        >
          {autoDetect ? (
            <ToggleRight size={14} className="text-[#a6e3a1]" />
          ) : (
            <ToggleLeft size={14} />
          )}
          <span>تلقائي</span>
        </button>
      </div>
    </div>
  );
}

// ─── Export ──────────────────────────────────────────────────────

export { OODAPhaseIndicator };
export type { OODAStatusBarProps, OODAPhaseIndicatorProps };
