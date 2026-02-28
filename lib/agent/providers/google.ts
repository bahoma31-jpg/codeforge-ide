/**
 * CodeForge IDE — Google Gemini Provider Adapter
 * Handles communication with Google Generative AI API.
 * Supports Gemini 2.0 Flash, Flash Lite, and 1.5 Pro.
 */

import type { AgentConfig, ToolDefinition, AgentMessage } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Convert agent messages to Gemini format
 */
function formatMessages(messages: AgentMessage[], systemPrompt: string) {
  const contents: Array<Record<string, unknown>> = [];

  for (const msg of messages) {
    if (msg.role === 'system') continue; // Handled via systemInstruction

    if (msg.role === 'tool' && msg.toolCalls?.length) {
      contents.push({
        role: 'function',
        parts: [
          {
            functionResponse: {
              name: msg.toolCalls[0].toolName,
              response: { result: msg.content },
            },
          },
        ],
      });
    } else if (msg.role === 'assistant' && msg.toolCalls?.length) {
      contents.push({
        role: 'model',
        parts: msg.toolCalls.map((tc) => ({
          functionCall: {
            name: tc.toolName,
            args: tc.args,
          },
        })),
      });
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  return { contents, systemInstruction: { parts: [{ text: systemPrompt }] } };
}

/**
 * Convert tool definitions to Gemini function declarations
 */
function formatTools(tools: ToolDefinition[]) {
  return [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
    },
  ];
}

/**
 * Create a streaming request to Gemini
 */
export async function createGeminiStream(
  config: AgentConfig,
  messages: AgentMessage[],
  tools: ToolDefinition[]
): Promise<Response> {
  const { contents, systemInstruction } = formatMessages(
    messages,
    config.systemPrompt
  );

  const body = {
    contents,
    systemInstruction,
    tools: formatTools(tools),
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    },
  };

  const url = `${GEMINI_API_URL}/models/${config.model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API error (${response.status}): ${(error as { error?: { message?: string } }).error?.message || response.statusText}`
    );
  }

  return response;
}

/**
 * Create a non-streaming request to Gemini
 */
export async function createGeminiCompletion(
  config: AgentConfig,
  messages: AgentMessage[],
  tools: ToolDefinition[]
): Promise<Record<string, unknown>> {
  const { contents, systemInstruction } = formatMessages(
    messages,
    config.systemPrompt
  );

  const body = {
    contents,
    systemInstruction,
    tools: formatTools(tools),
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    },
  };

  const url = `${GEMINI_API_URL}/models/${config.model}:generateContent?key=${config.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API error (${response.status}): ${(error as { error?: { message?: string } }).error?.message || response.statusText}`
    );
  }

  return response.json();
}
