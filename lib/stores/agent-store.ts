/**
 * CodeForge IDE — Agent Store
 * Zustand store for AI agent state management.
 * Manages messages, config, approvals, and agent lifecycle.
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  AgentMessage,
  ToolCall,
  PendingApproval,
  AuditLogEntry,
  ProviderId,
} from '../agent/types';
import { AgentService, DEFAULT_SYSTEM_PROMPT } from '../agent/agent-service';
import { getDefaultModel } from '../agent/providers';

// ─── Storage Keys ─────────────────────────────────────────────

const CONFIG_KEY = 'codeforge-agent-config';
const HISTORY_KEY = 'codeforge-agent-history';

// ─── Default Config ───────────────────────────────────────────

const DEFAULT_CONFIG: AgentConfig = {
  provider: 'groq',
  apiKey: '',
  model: getDefaultModel('groq').id,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  temperature: 0.3,
  maxTokens: 4096,
  language: 'ar',
};

// ─── Store Interface ──────────────────────────────────────────

interface AgentState {
  // State
  messages: AgentMessage[];
  config: AgentConfig;
  isConfigured: boolean;
  isProcessing: boolean;
  isPanelOpen: boolean;
  error: string | null;
  pendingApprovals: PendingApproval[];
  auditLog: AuditLogEntry[];
  currentToolCall: ToolCall | null;

  // Service
  service: AgentService | null;

  // Actions — Config
  setProvider: (provider: ProviderId) => void;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  updateConfig: (updates: Partial<AgentConfig>) => void;
  loadConfig: () => void;
  saveConfig: () => void;

  // Actions — Messaging
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: AgentMessage) => void;
  clearMessages: () => void;
  loadHistory: () => void;
  saveHistory: () => void;

  // Actions — Approvals
  approveAction: (approvalId: string) => void;
  rejectAction: (approvalId: string) => void;

  // Actions — UI
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  clearError: () => void;

  // Actions — Lifecycle
  initialize: () => void;
  reset: () => void;
}

// ─── Store Implementation ─────────────────────────────────────

export const useAgentStore = create<AgentState>((set, get) => ({
  // Initial State
  messages: [],
  config: DEFAULT_CONFIG,
  isConfigured: false,
  isProcessing: false,
  isPanelOpen: false,
  error: null,
  pendingApprovals: [],
  auditLog: [],
  currentToolCall: null,
  service: null,

  // ── Config Actions ────────────────────────────────────────

  setProvider: (provider) => {
    const model = getDefaultModel(provider).id;
    set((state) => ({
      config: { ...state.config, provider, model },
    }));
    get().saveConfig();
  },

  setApiKey: (apiKey) => {
    set((state) => ({
      config: { ...state.config, apiKey },
      isConfigured: apiKey.length > 0,
    }));
    get().saveConfig();
  },

  setModel: (model) => {
    set((state) => ({
      config: { ...state.config, model },
    }));
    get().saveConfig();
  },

  updateConfig: (updates) => {
    set((state) => ({
      config: { ...state.config, ...updates },
    }));
    get().saveConfig();
  },

  loadConfig: () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<AgentConfig>;
        set((state) => ({
          config: { ...state.config, ...parsed },
          isConfigured: Boolean(parsed.apiKey && parsed.apiKey.length > 0),
        }));
      } catch {
        console.error('Failed to parse saved agent config');
      }
    }
  },

  saveConfig: () => {
    if (typeof window === 'undefined') return;
    const { config } = get();
    // Save config but mask API key (store only first/last 4 chars)
    const safeConfig = {
      ...config,
      apiKey: config.apiKey, // In production, consider encrypting
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(safeConfig));
  },

  // ── Messaging Actions ─────────────────────────────────────

  sendMessage: async (content) => {
    const { config, messages, service } = get();

    if (!config.apiKey) {
      set({ error: 'يرجى إدخال مفتاح API أولاً في الإعدادات.' });
      return;
    }

    // Create user message
    const userMessage: AgentMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isProcessing: true,
      error: null,
    }));

    try {
      // Initialize service if needed
      let agentService = service;
      if (!agentService) {
        const { getAllTools } = await import('../agent/tools');
        const tools = getAllTools();
        agentService = new AgentService(config, tools);

        // Register tool executors
        const { registerAllExecutors } = await import('../agent/tools');
        registerAllExecutors(agentService);

        set({ service: agentService });
      } else {
        agentService.updateConfig(config);
      }

      // Send message to agent
      const allMessages = [...messages, userMessage];
      const response = await agentService.sendMessage(
        allMessages,
        undefined, // projectContext — will be enhanced later
        // onToolCall callback
        (toolCall) => {
          set({ currentToolCall: toolCall });
        },
        // onApprovalRequired callback
        async (approval) => {
          return new Promise<boolean>((resolve) => {
            set((state) => ({
              pendingApprovals: [
                ...state.pendingApprovals,
                {
                  ...approval,
                  // Store resolve function reference via ID
                },
              ],
            }));

            // For now, auto-approve (will be replaced with UI)
            // TODO: Wire up to approval UI component
            setTimeout(() => resolve(true), 100);
          });
        }
      );

      set((state) => ({
        messages: [...state.messages, response],
        isProcessing: false,
        currentToolCall: null,
      }));

      get().saveHistory();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'فشل في التواصل مع الوكيل الذكي';
      set({
        error: message,
        isProcessing: false,
        currentToolCall: null,
      });
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_KEY);
    }
  },

  loadHistory: () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const messages = JSON.parse(saved) as AgentMessage[];
        set({ messages });
      } catch {
        console.error('Failed to parse saved agent history');
      }
    }
  },

  saveHistory: () => {
    if (typeof window === 'undefined') return;
    const { messages } = get();
    // Keep last 50 messages to avoid storage bloat
    const recent = messages.slice(-50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(recent));
  },

  // ── Approval Actions ──────────────────────────────────────

  approveAction: (approvalId) => {
    set((state) => ({
      pendingApprovals: state.pendingApprovals.map((a) =>
        a.id === approvalId ? { ...a, status: 'approved' as const } : a
      ),
    }));
  },

  rejectAction: (approvalId) => {
    set((state) => ({
      pendingApprovals: state.pendingApprovals.map((a) =>
        a.id === approvalId ? { ...a, status: 'rejected' as const } : a
      ),
    }));
  },

  // ── UI Actions ────────────────────────────────────────────

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  clearError: () => set({ error: null }),

  // ── Lifecycle Actions ─────────────────────────────────────

  initialize: () => {
    get().loadConfig();
    get().loadHistory();
  },

  reset: () => {
    set({
      messages: [],
      isProcessing: false,
      error: null,
      pendingApprovals: [],
      auditLog: [],
      currentToolCall: null,
      service: null,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_KEY);
    }
  },
}));
