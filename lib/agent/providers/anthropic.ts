/**
 * CodeForge IDE — Anthropic Provider Adapter
 * Handles communication with Anthropic API (Claude).
 * Uses native Anthropic message format with tool_use blocks.
 */

import type { AgentConfig, ToolDefinition, AgentMessage } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Convert agent messages to Anthropic format
 */
function formatMessages(messages: AgentMessage[]) {
  const formatted: Array<Record<string, unknown>> = [];

  for (const msg of messages) {
    if (msg.role === 'system') continue; // Handled via system parameter

    if (msg.role === 'tool' && msg.toolCalls?.length) {
      formatted.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: msg.toolCalls[0].id,
            content: msg.content,
          },
        ],
      });
    } else if (msg.role === 'assistant' && msg.toolCalls?.length) {
      const content: Array<Record<string, unknown>> = [];
      if (msg.content) {
        content.push({ type: 'text', text: msg.content });
      }
      for (const tc of msg.toolCalls) {
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.toolName,
          input: tc.args,
        });
      }
      formatted.push({ role: 'assistant', content });
    } else {
      formatted.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }
  }

  return formatted;
}

/**
 * Convert tool definitions to Anthropic tool format
 */
function formatTools(tools: ToolDefinition[]) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}

/**
 * Create a streaming request to Anthropic
 */
export async function createAnthropicStream(
  config: AgentConfig,
  messages: AgentMessage[],
  tools: ToolDefinition[]
): Promise<Response> {
  const body = {
    model: config.model,
    system: config.systemPrompt,
    messages: formatMessages(messages),
    tools: formatTools(tools),
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    stream: true,
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Anthropic API error (${response.status}): ${(error as { error?: { message?: string } }).error?.message || response.statusText}`
    );
  }

  return response;
}

/**
 * Create a non-streaming request to Anthropic
 */
export async function createAnthropicCompletion(
  config: AgentConfig,
  messages: AgentMessage[],
  tools: ToolDefinition[]
): Promise<Record<string, unknown>> {
  const body = {
    model: config.model,
    system: config.systemPrompt,
    messages: formatMessages(messages),
    tools: formatTools(tools),
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    stream: false,
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Anthropic API error (${response.status}): ${(error as { error?: { message?: string } }).error?.message || response.statusText}`
    );
  }

  return response.json();
}
