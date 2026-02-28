/**
 * CodeForge IDE — useOODABridge React Hook (Phase 8)
 * Provides React components with access to the OODABridge state.
 *
 * Features:
 * - Reactive state updates from OODABridge events
 * - Automatic cleanup on unmount
 * - Bridge stats, active cycles, and readiness
 * - Integration with agent settings for Groq API key
 *
 * Usage:
 *   const { isReady, stats, events, mode, runCycle } = useOODABridge();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  OODABridge,
  getOODABridge,
  type OODABridgeConfig,
  type SelfImproveRequest,
  type SelfImproveResult,
  type BridgeEvent,
} from '../bridge';

// ─── Types ───────────────────────────────────────────────────────

export interface OODABridgeState {
  /** Whether the bridge is configured and ready */
  isReady: boolean;
  /** Current model being used */
  model: string;
  /** Bridge statistics */
  stats: {
    totalCycles: number;
    activeCycles: number;
    successfulCycles: number;
    failedCycles: number;
    totalTokens: number;
  };
  /** Recent events from the bridge (last 50) */
  events: BridgeEvent[];
  /** Last cycle result */
  lastResult: SelfImproveResult | null;
  /** Whether a cycle is currently running */
  isRunning: boolean;
  /** Error message if something went wrong */
  error: string | null;
}

export interface UseOODABridgeReturn extends OODABridgeState {
  /** Initialize or update the bridge configuration */
  configure: (config: OODABridgeConfig) => void;
  /** Run an analysis cycle */
  runCycle: (request: SelfImproveRequest) => Promise<SelfImproveResult | null>;
  /** Clear events list */
  clearEvents: () => void;
  /** Get the raw bridge instance */
  bridge: OODABridge | null;
}

// ─── Hook ────────────────────────────────────────────────────────

export function useOODABridge(
  initialConfig?: OODABridgeConfig
): UseOODABridgeReturn {
  const bridgeRef = useRef<OODABridge | null>(null);
  const [state, setState] = useState<OODABridgeState>({
    isReady: false,
    model: 'llama-3.3-70b-versatile',
    stats: {
      totalCycles: 0,
      activeCycles: 0,
      successfulCycles: 0,
      failedCycles: 0,
      totalTokens: 0,
    },
    events: [],
    lastResult: null,
    isRunning: false,
    error: null,
  });

  // Initialize bridge
  useEffect(() => {
    if (initialConfig) {
      bridgeRef.current = new OODABridge(initialConfig);
    } else {
      bridgeRef.current = getOODABridge();
    }

    const bridge = bridgeRef.current;

    // Subscribe to events
    const unsubscribe = bridge.onEvent((event: BridgeEvent) => {
      setState((prev) => ({
        ...prev,
        events: [...prev.events.slice(-49), event], // Keep last 50
        stats: bridge.getStats(),
      }));
    });

    // Initial state
    setState((prev) => ({
      ...prev,
      isReady: bridge.isReady(),
      model: bridge.getModel(),
      stats: bridge.getStats(),
    }));

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Configure bridge
  const configure = useCallback((config: OODABridgeConfig) => {
    if (bridgeRef.current) {
      bridgeRef.current.updateConfig(config);
    } else {
      bridgeRef.current = new OODABridge(config);
    }

    const bridge = bridgeRef.current;
    setState((prev) => ({
      ...prev,
      isReady: bridge.isReady(),
      model: bridge.getModel(),
      stats: bridge.getStats(),
    }));
  }, []);

  // Run analysis cycle
  const runCycle = useCallback(
    async (request: SelfImproveRequest): Promise<SelfImproveResult | null> => {
      const bridge = bridgeRef.current;
      if (!bridge || !bridge.isReady()) {
        setState((prev) => ({
          ...prev,
          error: 'الجسر غير جاهز — يرجى إعداد مفتاح Groq API',
        }));
        return null;
      }

      setState((prev) => ({ ...prev, isRunning: true, error: null }));

      try {
        const result = await bridge.runAnalysisCycle(request);
        setState((prev) => ({
          ...prev,
          isRunning: false,
          lastResult: result,
          stats: bridge.getStats(),
          error: result.success ? null : result.error || null,
        }));
        return result;
      } catch (error) {
        const msg = (error as Error).message;
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: msg,
        }));
        return null;
      }
    },
    []
  );

  // Clear events
  const clearEvents = useCallback(() => {
    setState((prev) => ({ ...prev, events: [] }));
  }, []);

  return {
    ...state,
    configure,
    runCycle,
    clearEvents,
    bridge: bridgeRef.current,
  };
}
