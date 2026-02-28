/**
 * اختبارات وحدة لـ Agent Store
 * يغطي: الحالة الأولية، Panel Actions، Config Actions، Approval/Notification Actions
 *
 * ملاحظة: sendMessage و initialize يعتمدان على AgentService + localStorage
 * لذلك نختبر state changes فقط بدون الاعتماد على الخدمات الخارجية.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock external dependencies BEFORE importing the store
vi.mock('@/lib/agent/agent-service', () => ({
  AgentService: vi.fn().mockImplementation(() => ({
    updateConfig: vi.fn(),
    sendMessage: vi.fn(),
    getAuditLog: vi.fn().mockReturnValue([]),
  })),
}));

vi.mock('@/lib/agent/tools', () => ({
  allTools: [],
  registerAllExecutors: vi.fn(),
}));

vi.mock('@/lib/agent/providers', () => ({
  getDefaultModel: vi.fn().mockReturnValue({ id: 'test-model', name: 'Test' }),
}));

vi.mock('@/lib/agent/safety', () => ({}));

// Mock localStorage
const localStorageMock: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock[key];
  }),
});

import { useAgentStore } from '../agent-store';

// ─── Reset Helper ─────────────────────────────────────────────

function resetStore() {
  useAgentStore.setState({
    messages: [],
    isProcessing: false,
    isPanelOpen: false,
    error: null,
    isConfigured: false,
    config: {
      provider: 'groq',
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      maxTokens: 4096,
      language: 'ar',
      githubToken: '',
    },
    pendingApprovals: [],
    notifications: [],
    auditLog: [],
    currentToolCall: null,
  });
}

// ─── Tests ────────────────────────────────────────────────────

describe('AgentStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  // ── الحالة الأولية ──

  describe('Initial State', () => {
    it('should start with empty messages', () => {
      expect(useAgentStore.getState().messages).toHaveLength(0);
    });

    it('should not be processing initially', () => {
      expect(useAgentStore.getState().isProcessing).toBe(false);
    });

    it('should have panel closed initially', () => {
      expect(useAgentStore.getState().isPanelOpen).toBe(false);
    });

    it('should have no error initially', () => {
      expect(useAgentStore.getState().error).toBeNull();
    });

    it('should not be configured without API key', () => {
      expect(useAgentStore.getState().isConfigured).toBe(false);
    });

    it('should have empty pending approvals', () => {
      expect(useAgentStore.getState().pendingApprovals).toHaveLength(0);
    });

    it('should have empty notifications', () => {
      expect(useAgentStore.getState().notifications).toHaveLength(0);
    });
  });

  // ── Panel Actions ──

  describe('Panel Actions', () => {
    it('should open panel', () => {
      useAgentStore.getState().openPanel();
      expect(useAgentStore.getState().isPanelOpen).toBe(true);
    });

    it('should close panel', () => {
      useAgentStore.setState({ isPanelOpen: true });
      useAgentStore.getState().closePanel();
      expect(useAgentStore.getState().isPanelOpen).toBe(false);
    });

    it('should toggle panel from closed to open', () => {
      useAgentStore.getState().togglePanel();
      expect(useAgentStore.getState().isPanelOpen).toBe(true);
    });

    it('should toggle panel from open to closed', () => {
      useAgentStore.setState({ isPanelOpen: true });
      useAgentStore.getState().togglePanel();
      expect(useAgentStore.getState().isPanelOpen).toBe(false);
    });
  });

  // ── Message Actions ──

  describe('Message Actions', () => {
    it('should clear all messages and related state', () => {
      useAgentStore.setState({
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'test',
            createdAt: Date.now(),
          },
        ],
        pendingApprovals: [
          {
            id: 'a1',
            toolCall: {
              id: 'tc1',
              name: 'test',
              arguments: {},
            },
            toolName: 'test',
            description: 'test',
            riskLevel: 'confirm',
            status: 'pending',
            createdAt: Date.now(),
          },
        ],
        notifications: [
          {
            id: 'n1',
            toolName: 'test',
            description: 'test',
            affectedFiles: [],
            createdAt: Date.now(),
          },
        ],
      });

      useAgentStore.getState().clearMessages();

      const state = useAgentStore.getState();
      expect(state.messages).toHaveLength(0);
      expect(state.pendingApprovals).toHaveLength(0);
      expect(state.notifications).toHaveLength(0);
      expect(state.auditLog).toHaveLength(0);
    });
  });

  // ── Error Actions ──

  describe('Error Actions', () => {
    it('should clear error', () => {
      useAgentStore.setState({ error: 'حدث خطأ' });
      useAgentStore.getState().clearError();
      expect(useAgentStore.getState().error).toBeNull();
    });
  });

  // ── Config Actions ──

  describe('Config Actions', () => {
    it('should set provider and reset API key', () => {
      useAgentStore.setState({
        config: { ...useAgentStore.getState().config, apiKey: 'old-key' },
        isConfigured: true,
      });

      useAgentStore.getState().setProvider('openai');

      const state = useAgentStore.getState();
      expect(state.config.provider).toBe('openai');
      expect(state.config.apiKey).toBe('');
      expect(state.isConfigured).toBe(false);
    });

    it('should persist provider change to localStorage', () => {
      useAgentStore.getState().setProvider('anthropic');
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should set API key and mark as configured', () => {
      useAgentStore.getState().setApiKey('sk-test-key-123');

      const state = useAgentStore.getState();
      expect(state.config.apiKey).toBe('sk-test-key-123');
      expect(state.isConfigured).toBe(true);
    });

    it('should mark as not configured when API key is empty', () => {
      useAgentStore.getState().setApiKey('');
      expect(useAgentStore.getState().isConfigured).toBe(false);
    });

    it('should set model', () => {
      useAgentStore.getState().setModel('gpt-4o');
      expect(useAgentStore.getState().config.model).toBe('gpt-4o');
    });

    it('should set GitHub token', () => {
      useAgentStore.getState().setGitHubToken('ghp_test123');
      expect(useAgentStore.getState().config.githubToken).toBe('ghp_test123');
    });

    it('should update partial config', () => {
      useAgentStore.getState().updateConfig({
        temperature: 0.7,
        maxTokens: 8192,
      });

      const config = useAgentStore.getState().config;
      expect(config.temperature).toBe(0.7);
      expect(config.maxTokens).toBe(8192);
      // باقي الإعدادات يجب أن تبقى كما هي
      expect(config.provider).toBe('groq');
    });
  });

  // ── Approval Actions ──

  describe('Approval Actions', () => {
    const mockApproval = {
      id: 'approval-1',
      toolCall: { id: 'tc1', name: 'github_delete_file', arguments: {} },
      toolName: 'github_delete_file',
      description: 'حذف ملف',
      riskLevel: 'confirm' as const,
      status: 'pending' as const,
      createdAt: Date.now(),
    };

    it('should update approval status to approved', () => {
      useAgentStore.setState({ pendingApprovals: [mockApproval] });

      useAgentStore.getState().approveAction('approval-1');

      const approval = useAgentStore
        .getState()
        .pendingApprovals.find((a) => a.id === 'approval-1');
      expect(approval?.status).toBe('approved');
    });

    it('should update approval status to rejected', () => {
      useAgentStore.setState({ pendingApprovals: [mockApproval] });

      useAgentStore.getState().rejectAction('approval-1');

      const approval = useAgentStore
        .getState()
        .pendingApprovals.find((a) => a.id === 'approval-1');
      expect(approval?.status).toBe('rejected');
    });

    it('should handle approving non-existent approval gracefully', () => {
      // يجب ألا ينهار البرنامج
      expect(() => {
        useAgentStore.getState().approveAction('non-existent-id');
      }).not.toThrow();
    });
  });

  // ── Notification Actions ──

  describe('Notification Actions', () => {
    it('should dismiss a notification by ID', () => {
      useAgentStore.setState({
        notifications: [
          {
            id: 'n1',
            toolName: 'fs_create_file',
            description: 'إنشاء ملف',
            affectedFiles: ['test.ts'],
            createdAt: Date.now(),
          },
          {
            id: 'n2',
            toolName: 'git_commit',
            description: 'حفظ',
            affectedFiles: [],
            createdAt: Date.now(),
          },
        ],
      });

      useAgentStore.getState().dismissNotification('n1');

      const notifications = useAgentStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe('n2');
    });

    it('should clear all notifications', () => {
      useAgentStore.setState({
        notifications: [
          {
            id: 'n1',
            toolName: 'test',
            description: 'test',
            affectedFiles: [],
            createdAt: Date.now(),
          },
        ],
      });

      useAgentStore.getState().clearNotifications();
      expect(useAgentStore.getState().notifications).toHaveLength(0);
    });
  });
});
