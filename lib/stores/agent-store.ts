/**
 * CodeForge IDE — Agent Store (with Real Approval System)
 * Zustand store for AI agent state management.
 *
 * KEY FIX: Approval system now uses real async Promise resolvers
 * instead of setTimeout auto-approve hack.
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  AgentMessage,
  PendingApproval,
  AuditLogEntry,
  ToolCall,
  ProviderId,
} from '@/lib/agent/types';
import { AgentService } from '@/lib/agent/agent-service';
import { allTools, registerAllExecutors } from '@/lib/agent/tools';
import { AGENT_CONFIG_KEY, MAX_HISTORY_MESSAGES } from '@/lib/agent/constants';

// ─── Types ────────────────────────────────────────────────────

interface ApprovalResolver {
  resolve: (approved: boolean) => void;
  approval: PendingApproval;
}

interface AgentState {
  // Core
  messages: AgentMessage[];
  isProcessing: boolean;
  isPanelOpen: boolean;
  error: string | null;
  isConfigured: boolean;

  // Config
  config: AgentConfig;

  // Approvals
  pendingApprovals: PendingApproval[];
  auditLog: AuditLogEntry[];
  currentToolCall: ToolCall | null;

  // Actions — Core
  initialize: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;

  // Actions — Panel
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;

  // Actions — Config
  setProvider: (provider: ProviderId) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  updateConfig: (partial: Partial<AgentConfig>) => void;

  // Actions — Approvals
  approveAction: (approvalId: string) => void;
  rejectAction: (approvalId: string) => void;
}

// ─── Approval Resolver Map ────────────────────────────────────
// This lives outside the store to avoid serialization issues.
// Maps approval IDs to their Promise resolvers.

const approvalResolvers = new Map<string, ApprovalResolver>();

// ─── Service Instance ─────────────────────────────────────────

let agentService: AgentService | null = null;

function getOrCreateService(config: AgentConfig): AgentService {
  if (!agentService) {
    agentService = new AgentService(config, allTools);
    registerAllExecutors(agentService);
  } else {
    agentService.updateConfig(config);
  }
  return agentService;
}

// ─── Default Config ───────────────────────────────────────────

const defaultConfig: AgentConfig = {
  provider: 'groq',
  apiKey: '',
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,
  maxTokens: 4096,
  language: 'ar',
};

// ─── Store ────────────────────────────────────────────────────

export const useAgentStore = create<AgentState>((set, get) => ({
  // Initial state
  messages: [],
  isProcessing: false,
  isPanelOpen: false,
  error: null,
  isConfigured: false,
  config: defaultConfig,
  pendingApprovals: [],
  auditLog: [],
  currentToolCall: null,

  // ─── Initialize ──────────────────────────────────────────
  initialize: () => {
    try {
      const saved = localStorage.getItem(AGENT_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AgentConfig>;
        const config = { ...defaultConfig, ...parsed };
        set({
          config,
          isConfigured: !!config.apiKey,
        });
      }
    } catch (error) {
      console.error('[AgentStore] Failed to load config:', error);
    }
  },

  // ─── Send Message (main loop) ────────────────────────────
  sendMessage: async (content: string) => {
    const state = get();
    if (!state.isConfigured || state.isProcessing) return;

    // Add user message
    const userMessage: AgentMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };

    set((s) => ({
      messages: [...s.messages, userMessage],
      isProcessing: true,
      error: null,
    }));

    try {
      const service = getOrCreateService(get().config);
      const allMessages = get().messages;

      const response = await service.sendMessage(
        allMessages,
        undefined,
        // onToolCall — update current tool indicator
        (toolCall: ToolCall) => {
          set({ currentToolCall: toolCall });
        },
        // onApprovalRequired — show dialog and wait for real user input
        async (approval: PendingApproval): Promise<boolean> => {
          return new Promise<boolean>((resolve) => {
            // Store the resolver
            approvalResolvers.set(approval.id, { resolve, approval });

            // Add to pending approvals in UI
            set((s) => ({
              pendingApprovals: [...s.pendingApprovals, approval],
            }));
          });
        }
      );

      // Add assistant response
      set((s) => ({
        messages: [...s.messages, response].slice(-MAX_HISTORY_MESSAGES),
        currentToolCall: null,
        auditLog: service.getAuditLog(),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      set({ error: message, currentToolCall: null });
    } finally {
      set({ isProcessing: false });
    }
  },

  // ─── Approval Actions (real resolvers) ───────────────────
  approveAction: (approvalId: string) => {
    const resolver = approvalResolvers.get(approvalId);
    if (resolver) {
      resolver.resolve(true);
      approvalResolvers.delete(approvalId);
    }

    set((s) => ({
      pendingApprovals: s.pendingApprovals.map((a) =>
        a.id === approvalId ? { ...a, status: 'approved' as const } : a
      ),
    }));
  },

  rejectAction: (approvalId: string) => {
    const resolver = approvalResolvers.get(approvalId);
    if (resolver) {
      resolver.resolve(false);
      approvalResolvers.delete(approvalId);
    }

    set((s) => ({
      pendingApprovals: s.pendingApprovals.map((a) =>
        a.id === approvalId ? { ...a, status: 'rejected' as const } : a
      ),
    }));
  },

  // ─── Panel Actions ───────────────────────────────────────
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),

  // ─── Message Actions ─────────────────────────────────────
  clearMessages: () => set({ messages: [], pendingApprovals: [], auditLog: [] }),
  clearError: () => set({ error: null }),

  // ─── Config Actions (persist to localStorage) ────────────
  setProvider: (provider: ProviderId) => {
    set((s) => {
      const config = { ...s.config, provider, apiKey: '', model: '' };
      localStorage.setItem(AGENT_CONFIG_KEY, JSON.stringify(config));
      return { config, isConfigured: false };
    });
    agentService = null;
  },

  setApiKey: (apiKey: string) => {
    set((s) => {
      const config = { ...s.config, apiKey };
      localStorage.setItem(AGENT_CONFIG_KEY, JSON.stringify(config));
      return { config, isConfigured: !!apiKey };
    });
    agentService = null;
  },

  setModel: (model: string) => {
    set((s) => {
      const config = { ...s.config, model };
      localStorage.setItem(AGENT_CONFIG_KEY, JSON.stringify(config));
      return { config };
    });
    agentService = null;
  },

  updateConfig: (partial: Partial<AgentConfig>) => {
    set((s) => {
      const config = { ...s.config, ...partial };
      localStorage.setItem(AGENT_CONFIG_KEY, JSON.stringify(config));
      return { config, isConfigured: !!config.apiKey };
    });
    agentService = null;
  },
}));
