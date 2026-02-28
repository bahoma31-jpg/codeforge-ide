/**
 * CodeForge IDE — Bridge Module (Phase 7)
 * Connects all agent subsystems into a unified architecture.
 *
 * The bridge module is the integration layer that connects:
 * - AgentService (user-facing chat agent)
 * - OODAController (self-improvement engine)
 * - GroqProvider (LLM brain)
 * - ModelSelector (UI component)
 *
 * Architecture:
 * ┌───────────┐   ┌────────────┐   ┌───────────────┐
 * │ UI Layer  │──▶│ OODABridge │──▶│ GroqProvider   │
 * │ (React)   │   │ (Router)   │   │ (LLM Brain)    │
 * └───────────┘   │            │   └───────────────┘
 *                 │            │   ┌───────────────┐
 * ┌───────────┐   │            │──▶│ OODAController │
 * │ Agent     │──▶│            │   │ (Engine)       │
 * │ Service   │◀──│            │   └───────────────┘
 * └───────────┘   └────────────┘
 */

// OODA Bridge — core integration
export {
  OODABridge,
  getOODABridge,
  resetOODABridge,
  type OODABridgeConfig,
  type SelfImproveRequest,
  type SelfImproveResult,
  type BridgeEvent,
  type BridgeEventType,
  type BridgeEventHandler,
} from './ooda-bridge';

// Agent LLM Adapter — provider compatibility
export { AgentLLMAdapter } from './agent-llm-adapter';
