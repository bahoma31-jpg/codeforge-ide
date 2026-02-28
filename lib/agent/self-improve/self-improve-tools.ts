/**
 * CodeForge IDE — Self-Improvement Tools
 * Agent tools for self-analysis, dependency tracing, project mapping,
 * and OODA loop operations.
 *
 * Phase 1: 3 tools (🟢 AUTO read-only) — category: 'self-improve'
 *   - self_analyze_component, self_trace_dependency, self_map_project
 *
 * Phase 2: 5 tools (mixed risk levels) — category: 'self-improve'
 *   - self_start_improvement (🔴 CONFIRM), self_get_task_status (🟢 AUTO),
 *   - self_cancel_task (🟡 NOTIFY), self_get_suggestions (🟢 AUTO),
 *   - self_get_stats (🟢 AUTO)
 *
 * Phase 3: 5 tools — category: 'ooda' (separate file: ooda-tool-definitions.ts)
 *   - ooda_start_cycle, ooda_execute_fix, ooda_verify_fix,
 *   - ooda_learn_pattern, ooda_get_status
 *
 * This file handles self-improve category (8 tools).
 * For ooda category (5 tools), see ooda-tool-definitions.ts.
 * Total across both: 13 self-improvement tools.
 */

import type { ToolDefinition } from '../types';
import type { AgentService } from '../agent-service';
import { getSelfAnalysisEngine } from './self-analysis-engine';
import { oodaToolDefinitions, createOODAToolExecutors } from './ooda-tools';
import type { ToolBridge } from './fix-executor';

// ─── Phase 1 Tool Definitions ─────────────────────────────────

const phase1Tools: ToolDefinition[] = [
  {
    name: 'self_analyze_component',
    description:
      'Analyze a component/file from the CodeForge project itself. ' +
      'Returns detailed information: type (React component, hook, store, service, etc.), ' +
      'imports, exports, dependencies, dependents, props, state usage, complexity level, ' +
      'and line count. Use this to understand any file before modifying it.',
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description:
            'Path to the file to analyze, relative to project root. ' +
            'Example: "lib/agent/agent-service.ts" or "components/codeforge/layout/sidebar.tsx"',
        },
      },
      required: ['filePath'],
    },
    riskLevel: 'auto',
    category: 'self-improve',
  },
  {
    name: 'self_trace_dependency',
    description:
      'Trace the full dependency chain for a file. Shows upstream dependencies ' +
      '(files this file imports from) and downstream dependents (files that import this file). ' +
      'Also detects circular dependencies. Use this to understand the impact of changing a file.',
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description:
            'Path to the file to trace dependencies for. ' +
            'Example: "lib/agent/types.ts"',
        },
        maxDepth: {
          type: 'number',
          description:
            'Maximum depth to trace (default: 5). Higher values are slower.',
        },
      },
      required: ['filePath'],
    },
    riskLevel: 'auto',
    category: 'self-improve',
  },
  {
    name: 'self_map_project',
    description:
      'Build a complete map of the CodeForge project structure. Returns: total files/folders, ' +
      'files grouped by extension, dependency graph, entry points, config files, and component files. ' +
      'Use this as the first step when starting a self-improvement task to understand the full project layout.',
    parameters: {
      type: 'object',
      properties: {
        includeGraph: {
          type: 'boolean',
          description:
            'Whether to include the full dependency graph (default: true). Set false for a lighter overview.',
        },
      },
      required: [],
    },
    riskLevel: 'auto',
    category: 'self-improve',
  },
];

// ─── Phase 2 Tool Definitions (with risk levels) ──────────────

const phase2Tools: ToolDefinition[] = oodaToolDefinitions.map((tool) => {
  // Assign risk levels based on tool behavior
  let riskLevel: 'auto' | 'notify' | 'confirm' = 'auto';
  if (tool.name === 'self_start_improvement') riskLevel = 'confirm';
  if (tool.name === 'self_cancel_task') riskLevel = 'notify';

  return { ...tool, riskLevel };
});

// ─── Combined Exports ─────────────────────────────────────────

/** All 8 self-improve tool definitions */
export const selfImproveTools: ToolDefinition[] = [
  ...phase1Tools,
  ...phase2Tools,
];

/** Alias for backward compatibility */
export const selfImproveToolDefinitions = selfImproveTools;

/** Alias for executor registration (used by barrel re-export) */
export const selfImproveToolExecutors = selfImproveTools;

// ─── Helper: Load All Project Files ─────────────────────────────

async function loadProjectFiles(): Promise<Map<string, string>> {
  const { getAllNodes } = await import('@/lib/db/file-operations');
  const allNodes = await getAllNodes();
  const fileMap = new Map<string, string>();

  for (const node of allNodes) {
    if (node.type === 'file' && node.content) {
      fileMap.set(node.path, node.content);
    }
  }

  return fileMap;
}

// ─── Helper: Create Tool Bridge ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createToolBridge(service: AgentService): ToolBridge {
  return {
    readFile: async (filePath: string) => {
      const { readFileByPath } = await import('@/lib/db/file-operations');
      const file = await readFileByPath(filePath);
      return file.content || '';
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    editFile: async (filePath, oldStr, newStr, commitMessage) => {
      const { readFileByPath, updateFileContent } =
        await import('@/lib/db/file-operations');
      const file = await readFileByPath(filePath);
      const content = file.content || '';
      const newContent = content.replace(oldStr, newStr);
      if (newContent === content) return false;
      await updateFileContent(filePath, newContent);
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    writeFile: async (filePath, content, commitMessage) => {
      const { updateFileContent } = await import('@/lib/db/file-operations');
      await updateFileContent(filePath, content);
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    deleteFile: async (filePath, commitMessage) => {
      const { deleteNode } = await import('@/lib/db/file-operations');
      await deleteNode(filePath);
      return true;
    },
  };
}

// ─── Tool Executors ───────────────────────────────────────────

/** Register all self-improvement tool executors (Phase 1 + Phase 2) */
export function registerSelfImproveExecutors(service: AgentService): void {
  const engine = getSelfAnalysisEngine();

  // ══════════════════════════════════════════════════
  // Phase 1 Executors (read-only analysis)
  // ══════════════════════════════════════════════════

  // ── self_analyze_component ──
  service.registerToolExecutor('self_analyze_component', async (args) => {
    try {
      const filePath = args.filePath as string;
      if (!filePath) {
        return { success: false, error: 'filePath is required' };
      }

      let content: string;
      try {
        const { readFileByPath } = await import('@/lib/db/file-operations');
        const file = await readFileByPath(filePath);
        content = file.content || '';
      } catch {
        return {
          success: false,
          error: `File not found in local workspace: ${filePath}`,
        };
      }

      if (!content) {
        return { success: false, error: `File is empty: ${filePath}` };
      }

      const analysis = engine.analyzeComponent(filePath, content);

      try {
        const allFiles = await loadProjectFiles();
        const trace = engine.traceDependencies(filePath, allFiles, 1);
        analysis.dependents = trace.downstream;
      } catch {
        // Dependents will remain empty
      }

      return {
        success: true,
        data: {
          ...analysis,
          summary:
            `${analysis.componentName} is a ${analysis.type} with ${analysis.lineCount} lines ` +
            `(${analysis.estimatedComplexity} complexity). ` +
            `Imports from ${analysis.dependencies.length} local files, ` +
            `exported by ${analysis.exports.length} symbols.`,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── self_trace_dependency ──
  service.registerToolExecutor('self_trace_dependency', async (args) => {
    try {
      const filePath = args.filePath as string;
      if (!filePath) {
        return { success: false, error: 'filePath is required' };
      }

      const maxDepth = (args.maxDepth as number) || 5;
      const allFiles = await loadProjectFiles();

      if (!allFiles.has(filePath)) {
        return {
          success: false,
          error: `File not found: ${filePath}. Available files: ${allFiles.size}`,
        };
      }

      const trace = engine.traceDependencies(filePath, allFiles, maxDepth);

      const summary = [
        `📁 Dependency trace for: ${filePath}`,
        ``,
        `⬆️ Upstream (${trace.upstream.length} files this file imports from):`,
        ...trace.upstream.map((f) => `   → ${f}`),
        ``,
        `⬇️ Downstream (${trace.downstream.length} files that import this file):`,
        ...trace.downstream.map((f) => `   ← ${f}`),
      ];

      if (trace.circularDeps.length > 0) {
        summary.push(``, `⚠️ Circular dependencies detected:`);
        for (const dep of trace.circularDeps) {
          summary.push(`   🔄 ${dep}`);
        }
      }

      return {
        success: true,
        data: { ...trace, summary: summary.join('\n') },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── self_map_project ──
  service.registerToolExecutor('self_map_project', async (args) => {
    try {
      const includeGraph = args.includeGraph !== false;
      const allFiles = await loadProjectFiles();

      if (allFiles.size === 0) {
        return {
          success: false,
          error: 'No files found in the local workspace. Open a project first.',
        };
      }

      const projectMap = engine.buildProjectMap(allFiles);

      const extSummary = Object.entries(projectMap.filesByExtension)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ext, count]) => `  .${ext}: ${count} files`)
        .join('\n');

      const summary = [
        `📊 Project Map`,
        `Total: ${projectMap.totalFiles} files in ${projectMap.totalFolders} folders`,
        ``,
        `📁 Files by extension:`,
        extSummary,
        ``,
        `🚀 Entry points: ${projectMap.entryPoints.length}`,
        ...projectMap.entryPoints.map((e) => `   ${e}`),
        ``,
        `⚙️ Config files: ${projectMap.configFiles.length}`,
        ...projectMap.configFiles.map((c) => `   ${c}`),
        ``,
        `🧩 Component files: ${projectMap.componentFiles.length}`,
      ].join('\n');

      const result: Record<string, unknown> = {
        totalFiles: projectMap.totalFiles,
        totalFolders: projectMap.totalFolders,
        filesByExtension: projectMap.filesByExtension,
        entryPoints: projectMap.entryPoints,
        configFiles: projectMap.configFiles,
        componentCount: projectMap.componentFiles.length,
        summary,
      };

      if (includeGraph) {
        const simplifiedGraph: Record<string, string[]> = {};
        for (const [path, node] of Object.entries(projectMap.dependencyGraph)) {
          simplifiedGraph[path] = node.imports.filter(
            (i) => i.startsWith('.') || i.startsWith('@/')
          );
        }
        result.dependencyGraph = simplifiedGraph;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ══════════════════════════════════════════════════
  // Phase 2 Executors (OODA loop operations)
  // ══════════════════════════════════════════════════

  const toolBridge = createToolBridge(service);
  const oodaExecutors = createOODAToolExecutors(toolBridge, loadProjectFiles);

  for (const [toolName, executor] of Object.entries(oodaExecutors)) {
    service.registerToolExecutor(toolName, executor);
  }
}
