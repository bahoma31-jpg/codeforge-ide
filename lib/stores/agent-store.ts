/**
 * CodeForge IDE — Agent Store v2.2 (Triple-Layer Safety)
 * Zustand store for AI agent state management.
 *
 * v2.2.1 — Fixed: All Unicode escape sequences replaced with direct Arabic text.
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
import { getDefaultModel } from '@/lib/agent/providers';
import type { ToolNotification } from '@/lib/agent/safety';

// ─── Types ────────────────────────────────────────────────────

interface ApprovalResolver {
  resolve: (approved: boolean) => void;
  approval: PendingApproval;
}

export interface UINotification {
  id: string;
  toolName: string;
  description: string;
  affectedFiles: string[];
  createdAt: number;
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

  // Approvals & Notifications
  pendingApprovals: PendingApproval[];
  notifications: UINotification[];
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
  setGitHubToken: (token: string) => void;
  updateConfig: (partial: Partial<AgentConfig>) => void;

  // Actions — Approvals
  approveAction: (approvalId: string) => void;
  rejectAction: (approvalId: string) => void;

  // Actions — Notifications
  dismissNotification: (notificationId: string) => void;
  clearNotifications: () => void;
}

// ─── Approval Resolver Map ────────────────────────────────────

const approvalResolvers = new Map<string, ApprovalResolver>();

// ─── Service Instance ───────────────────────────────────────

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

// ─── Default Config ─────────────────────────────────────────

const defaultConfig: AgentConfig = {
  provider: 'groq',
  apiKey: '',
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,
  maxTokens: 4096,
  language: 'ar',
  githubToken: '',
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
  notifications: [],
  auditLog: [],
  currentToolCall: null,

  // ─── Initialize ──────────────────────────────────────────
  initialize: () => {
    try {
      const saved = localStorage.getItem(AGENT_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AgentConfig>;
        const config = { ...defaultConfig, ...parsed };

        // FIX: If model is empty, auto-select first model from provider
        if (!config.model && config.provider) {
          try {
            const defaultModel = getDefaultModel(config.provider);
            config.model = defaultModel.id;
          } catch {
            // fallback — keep empty, user will select
          }
        }

        set({
          config,
          isConfigured: !!config.apiKey,
        });
      }
    } catch (error) {
      console.error('[AgentStore] Failed to load config:', error);
    }
  },

  // ─── Send Message (main loop with triple-layer safety) ────
  sendMessage: async (content: string) => {
    const state = get();
    if (!state.isConfigured || state.isProcessing) return;

    // Safety: ensure model is set before sending
    if (!state.config.model) {
      set({ error: 'يرجى اختيار نموذج من الإعدادات أولاً' });
      return;
    }

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
        },

        // projectContext (undefined — will use default)
        undefined,

        // onNotify — show non-blocking toast for NOTIFY-level tools
        (notification: ToolNotification) => {
          const uiNotification: UINotification = {
            id: notification.id,
            toolName: notification.toolName,
            description: notification.description,
            affectedFiles: notification.affectedFiles,
            createdAt: notification.createdAt,
          };
          set((s) => ({
            notifications: [...s.notifications, uiNotification],
          }));
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

  // ─── Approval Actions (real resolvers) ─────────────────────
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

  // ─── Notification Actions ──────────────────────────────────
  dismissNotification: (notificationId: string) => {
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== notificationId),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  // ─── Panel Actions ─────────────────────────────────────────
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),

  // ─── Message Actions ───────────────────────────────────────
  clearMessages: () => set({ messages: [], pendingApprovals: [], notifications: [], auditLog: [] }),
  clearError: () => set({ error: null }),

  // ─── Config Actions (persist to localStorage) ────────────────
  setProvider: (provider: ProviderId) => {
    // FIX: Auto-select first model from the new provider
    let firstModel = '';
    try {
      const defaultModel = getDefaultModel(provider);
      firstModel = defaultModel.id;
    } catch {
      // fallback
    }

    set((s) => {
      const config = { ...s.config, provider, apiKey: '', model: firstModel };
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

  setGitHubToken: (githubToken: string) => {
    set((s) => {
      const config = { ...s.config, githubToken };
      localStorage.setItem(AGENT_CONFIG_KEY, JSON.stringify(config));
      return { config };
    });
    // No need to reset agentService — token is read at tool execution time
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
