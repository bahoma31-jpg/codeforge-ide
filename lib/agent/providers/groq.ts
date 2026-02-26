/**
 * CodeForge IDE — Groq Provider Adapter
 * Handles communication with Groq API (OpenAI-compatible).
 * Supports Llama 3.3, Mixtral, and more.
 */

import type { AgentConfig, ToolDefinition, AgentMessage } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Convert agent messages to Groq (OpenAI-compatible) format
 */
function formatMessages(messages: AgentMessage[], systemPrompt: string) {
  const formatted: Array<Record<string, unknown>> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of messages) {
    if (msg.role === 'tool' && msg.toolCalls?.length) {
      formatted.push({
        role: 'tool',
        tool_call_id: msg.toolCalls[0].id,
        content: msg.content,
      });
    } else if (msg.role === 'assistant' && msg.toolCalls?.length) {
      formatted.push({
        role: 'assistant',
        content: msg.content || null,
        tool_calls: msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.toolName,
            arguments: JSON.stringify(tc.args),
          },
        })),
      });
    } else {
      formatted.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  return formatted;
}

/**
 * Convert tool definitions to Groq function format
 */
function formatTools(tools: ToolDefinition[]) {
  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

/**
 * Create a streaming request to Groq
 */
export async function createGroqStream(
  config: AgentConfig,
  messages: AgentMessage[],
  tools: ToolDefinition[]
): Promise<Response> {
  const body = {
    model: config.model,
    messages: formatMessages(messages, config.systemPrompt),
    tools: formatTools(tools),
    tool_choice: 'auto',
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: true,
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Groq API error (${response.status}): ${(error as { error?: { message?: string } }).error?.message || response.statusText}`
    );
  }

  return response;
}

/**
 * Create a non-streaming request to Groq
 */
export async function createGroqCompletion(
  config: AgentConfig,
  messages: AgentMessage[],
  tools: ToolDefinition[]
): Promise<Record<string, unknown>> {
  const body = {
    model: config.model,
    messages: formatMessages(messages, config.systemPrompt),
    tools: formatTools(tools),
    tool_choice: 'auto',
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: false,
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Groq API error (${response.status}): ${(error as { error?: { message?: string } }).error?.message || response.statusText}`
    );
  }

  return response.json();
}
