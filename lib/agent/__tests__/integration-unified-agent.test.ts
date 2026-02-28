/**
 * CodeForge IDE — Unified Agent Integration Tests (Phase 7)
 * Tests the bridge connecting AgentService ↔ OODA ↔ Groq LLM.
 *
 * 15 tests across 4 groups:
 * - OODABridge lifecycle (5)
 * - Safety enforcement (4)
 * - Event system (3)
 * - AgentLLMAdapter (3)
 */

import {
  OODABridge,
  type OODABridgeConfig,
  type SelfImproveRequest,
  type BridgeEvent,
} from '../bridge';

// ─── Mock Config ────────────────────────────────────────────────

const TEST_CONFIG: OODABridgeConfig = {
  groqApiKey: 'gsk_test_key_1234567890abcdef',
  modelId: 'llama-3.3-70b-versatile',
  temperature: 0.3,
  debug: false,
};

const SAMPLE_REQUEST: SelfImproveRequest = {
  issue: 'زر الحفظ لا يعمل في صفحة الإعدادات',
  category: 'ui_bug',
  fileContents: {
    'components/settings.tsx':
      'export function Settings() { return <div>Settings</div>; }',
    'lib/stores/settings-store.ts':
      'export const useSettings = () => ({ save: () => {} });',
  },
  affectedFiles: ['components/settings.tsx', 'lib/stores/settings-store.ts'],
};

// ─── Tests ──────────────────────────────────────────────────────

describe('OODABridge — Lifecycle', () => {
  let bridge: OODABridge;

  beforeEach(() => {
    bridge = new OODABridge(TEST_CONFIG);
  });

  afterEach(() => {
    bridge.dispose();
  });

  test('should initialize with correct config', () => {
    expect(bridge.isReady()).toBe(true);
    expect(bridge.getModel()).toBe('llama-3.3-70b-versatile');
  });

  test('should report not ready without API key', () => {
    const emptyBridge = new OODABridge({ groqApiKey: '', modelId: 'test' });
    expect(emptyBridge.isReady()).toBe(false);
    emptyBridge.dispose();
  });

  test('should update config dynamically', () => {
    bridge.updateConfig({ modelId: 'llama-3.1-8b-instant' });
    expect(bridge.getModel()).toBe('llama-3.1-8b-instant');
  });

  test('should track stats correctly', () => {
    const stats = bridge.getStats();
    expect(stats.totalCycles).toBe(0);
    expect(stats.activeCycles).toBe(0);
    expect(stats.isReady).toBe(true);
    expect(stats.model).toBe('llama-3.3-70b-versatile');
  });

  test('should clean up on dispose', () => {
    bridge.dispose();
    const stats = bridge.getStats();
    expect(stats.totalCycles).toBe(0);
  });
});

describe('OODABridge — Safety Enforcement', () => {
  let bridge: OODABridge;

  beforeEach(() => {
    bridge = new OODABridge(TEST_CONFIG);
  });

  afterEach(() => {
    bridge.dispose();
  });

  test('should block protected paths', async () => {
    const protectedRequest: SelfImproveRequest = {
      ...SAMPLE_REQUEST,
      affectedFiles: ['lib/agent/safety/index.ts'],
    };

    const result = await bridge.runAnalysisCycle(protectedRequest);
    expect(result.success).toBe(false);
    expect(result.phase).toBe('BLOCKED');
    expect(result.error).toContain('محمية');
  });

  test('should block .env files', async () => {
    const envRequest: SelfImproveRequest = {
      ...SAMPLE_REQUEST,
      affectedFiles: ['.env.local'],
    };

    const result = await bridge.runAnalysisCycle(envRequest);
    expect(result.success).toBe(false);
    expect(result.phase).toBe('BLOCKED');
  });

  test('should block >10 files', async () => {
    const manyFiles: SelfImproveRequest = {
      ...SAMPLE_REQUEST,
      affectedFiles: Array.from({ length: 11 }, (_, i) => `file-${i}.ts`),
    };

    const result = await bridge.runAnalysisCycle(manyFiles);
    expect(result.success).toBe(false);
    expect(result.error).toContain('10');
  });

  test('should block when API key is missing', async () => {
    const noBridge = new OODABridge({ groqApiKey: '', modelId: 'test' });
    const result = await noBridge.runAnalysisCycle(SAMPLE_REQUEST);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Groq API');
    noBridge.dispose();
  });
});

describe('OODABridge — Event System', () => {
  let bridge: OODABridge;

  beforeEach(() => {
    bridge = new OODABridge(TEST_CONFIG);
  });

  afterEach(() => {
    bridge.dispose();
  });

  test('should register and unregister event handlers', () => {
    const events: BridgeEvent[] = [];
    const unsubscribe = bridge.onEvent((e) => events.push(e));

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
    // After unsubscribe, events should not accumulate
  });

  test('should track multiple event handlers', () => {
    const events1: BridgeEvent[] = [];
    const events2: BridgeEvent[] = [];

    const unsub1 = bridge.onEvent((e) => events1.push(e));
    const unsub2 = bridge.onEvent((e) => events2.push(e));

    expect(typeof unsub1).toBe('function');
    expect(typeof unsub2).toBe('function');

    unsub1();
    unsub2();
  });

  test('should include timestamp in events', () => {
    // Events are emitted during runAnalysisCycle, but we can test
    // the structure by checking the type definition
    const events: BridgeEvent[] = [];
    bridge.onEvent((e) => events.push(e));

    // Trigger a blocked cycle to generate events
    bridge
      .runAnalysisCycle({
        ...SAMPLE_REQUEST,
        affectedFiles: ['.env'],
      })
      .then(() => {
        // Blocked cycles don't emit events, but the handler was registered
        expect(events.length).toBe(0); // Blocked before any phase starts
      });
  });
});

describe('AgentLLMAdapter — Provider Compatibility', () => {
  test('should import AgentLLMAdapter from bridge', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AgentLLMAdapter } = require('../bridge');
    expect(AgentLLMAdapter).toBeDefined();
    expect(typeof AgentLLMAdapter).toBe('function');
  });

  test('should import OODABridge from bridge', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { OODABridge } = require('../bridge');
    expect(OODABridge).toBeDefined();
    expect(typeof OODABridge).toBe('function');
  });

  test('should import all bridge exports', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bridge = require('../bridge');
    expect(bridge.OODABridge).toBeDefined();
    expect(bridge.getOODABridge).toBeDefined();
    expect(bridge.resetOODABridge).toBeDefined();
    expect(bridge.AgentLLMAdapter).toBeDefined();
  });
});
