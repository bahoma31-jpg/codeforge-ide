/**
 * CodeForge IDE — Utility Tools
 * Agent tools for project context, code explanation, and suggestions.
 * 3 tools: getProjectContext, explainCode, suggestFix.
 */

import type { ToolDefinition } from '../types';
import type { AgentService } from '../agent-service';

// ─── Tool Definitions ─────────────────────────────────────────

export const utilityTools: ToolDefinition[] = [
  {
    name: 'get_project_context',
    description: 'Get project information including package.json, file count, folder structure, dependencies, and scripts.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    riskLevel: 'auto',
    category: 'utility',
  },
  {
    name: 'explain_code',
    description: 'Explain a piece of code. Returns a structured explanation (this tool does not call LLM — it prepares context for the agent to explain).',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The code snippet to explain.',
        },
        language: {
          type: 'string',
          description: 'The programming language of the code.',
        },
      },
      required: ['code'],
    },
    riskLevel: 'auto',
    category: 'utility',
  },
  {
    name: 'suggest_fix',
    description: 'Analyze an error message and the relevant code context to suggest a fix.',
    parameters: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'The error message or stack trace.',
        },
        filePath: {
          type: 'string',
          description: 'Path of the file where the error occurred.',
        },
        lineNumber: {
          type: 'number',
          description: 'Line number where the error occurred.',
        },
      },
      required: ['error'],
    },
    riskLevel: 'auto',
    category: 'utility',
  },
];

// ─── Tool Executors ───────────────────────────────────────────

export function registerUtilityExecutors(service: AgentService): void {
  // get_project_context
  service.registerToolExecutor('get_project_context', async () => {
    try {
      const { getAllNodes } = await import('@/lib/db/file-operations');
      const allNodes = await getAllNodes();

      const files = allNodes.filter((n) => n.type === 'file');
      const folders = allNodes.filter((n) => n.type === 'folder');

      // Try to find package.json
      const packageJson = files.find((f) => f.name === 'package.json');
      let projectInfo: Record<string, unknown> = {};

      if (packageJson?.content) {
        try {
          const parsed = JSON.parse(packageJson.content);
          projectInfo = {
            name: parsed.name,
            version: parsed.version,
            description: parsed.description,
            dependencies: Object.keys(parsed.dependencies || {}),
            devDependencies: Object.keys(parsed.devDependencies || {}),
            scripts: parsed.scripts,
          };
        } catch {
          projectInfo = { raw: packageJson.content };
        }
      }

      // Build simple file tree
      const tree = allNodes
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((n) => `${n.type === 'folder' ? '📁' : '📄'} ${n.path}`)
        .join('\n');

      // Language stats
      const langStats: Record<string, number> = {};
      for (const file of files) {
        const lang = file.language || 'unknown';
        langStats[lang] = (langStats[lang] || 0) + 1;
      }

      return {
        success: true,
        data: {
          totalFiles: files.length,
          totalFolders: folders.length,
          projectInfo,
          languageStats: langStats,
          fileTree: tree,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // explain_code — just returns the code as context for the LLM
  service.registerToolExecutor('explain_code', async (args) => {
    return {
      success: true,
      data: {
        code: args.code,
        language: args.language || 'unknown',
        instruction: 'Please explain this code to the user in their preferred language.',
      },
    };
  });

  // suggest_fix — returns error context for the LLM
  service.registerToolExecutor('suggest_fix', async (args) => {
    try {
      let fileContent = '';

      if (args.filePath) {
        try {
          const { readFileByPath } = await import('@/lib/db/file-operations');
          const file = await readFileByPath(args.filePath as string);
          fileContent = file.content || '';
        } catch {
          fileContent = '[File not found]';
        }
      }

      return {
        success: true,
        data: {
          error: args.error,
          filePath: args.filePath || 'unknown',
          lineNumber: args.lineNumber,
          fileContent,
          instruction: 'Analyze this error and suggest a fix. Show the corrected code.',
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
