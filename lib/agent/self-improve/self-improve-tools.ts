/**
 * CodeForge IDE — Self-Improvement Tools
 * Agent tools for self-analysis, dependency tracing, and project mapping.
 * 3 tools: self_analyze_component, self_trace_dependency, self_map_project.
 *
 * All tools are 🟢 AUTO (read-only analysis) — they never modify files.
 */

import type { ToolDefinition } from '../types';
import type { AgentService } from '../agent-service';
import { getSelfAnalysisEngine } from './self-analysis-engine';

// ─── Tool Definitions ─────────────────────────────────────────

export const selfImproveTools: ToolDefinition[] = [
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
          description: 'Maximum depth to trace (default: 5). Higher values are slower.',
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
          description: 'Whether to include the full dependency graph (default: true). Set false for a lighter overview.',
        },
      },
      required: [],
    },
    riskLevel: 'auto',
    category: 'self-improve',
  },
];

// ─── Helper: Load All Project Files ───────────────────────────

/**
 * Load all files from the local workspace into a Map<path, content>.
 * Uses the same file-operations module as other tools.
 */
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

// ─── Tool Executors ───────────────────────────────────────────

export function registerSelfImproveExecutors(service: AgentService): void {
  const engine = getSelfAnalysisEngine();

  // ── self_analyze_component ──
  service.registerToolExecutor('self_analyze_component', async (args) => {
    try {
      const filePath = args.filePath as string;
      if (!filePath) {
        return { success: false, error: 'filePath is required' };
      }

      // Try to read the file from local workspace
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

      // Try to find dependents by loading project files
      try {
        const allFiles = await loadProjectFiles();
        const trace = engine.traceDependencies(filePath, allFiles, 1);
        analysis.dependents = trace.downstream;
      } catch {
        // Dependents will remain empty if we can't load all files
      }

      return {
        success: true,
        data: {
          ...analysis,
          summary: `${analysis.componentName} is a ${analysis.type} with ${analysis.lineCount} lines ` +
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

      // Build a human-readable summary
      const summary = [
        `📁 Dependency trace for: ${filePath}`,
        ``,
        `⬆️ Upstream (${trace.upstream.length} files this file imports from):`,
        ...trace.upstream.map(f => `   → ${f}`),
        ``,
        `⬇️ Downstream (${trace.downstream.length} files that import this file):`,
        ...trace.downstream.map(f => `   ← ${f}`),
      ];

      if (trace.circularDeps.length > 0) {
        summary.push(``, `⚠️ Circular dependencies detected:`);
        for (const dep of trace.circularDeps) {
          summary.push(`   🔄 ${dep}`);
        }
      }

      return {
        success: true,
        data: {
          ...trace,
          summary: summary.join('\n'),
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── self_map_project ──
  service.registerToolExecutor('self_map_project', async (args) => {
    try {
      const includeGraph = args.includeGraph !== false; // default true
      const allFiles = await loadProjectFiles();

      if (allFiles.size === 0) {
        return {
          success: false,
          error: 'No files found in the local workspace. Open a project first.',
        };
      }

      const projectMap = engine.buildProjectMap(allFiles);

      // Build a concise summary
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
        ...projectMap.entryPoints.map(e => `   ${e}`),
        ``,
        `⚙️ Config files: ${projectMap.configFiles.length}`,
        ...projectMap.configFiles.map(c => `   ${c}`),
        ``,
        `🧩 Component files: ${projectMap.componentFiles.length}`,
      ].join('\n');

      // Return with or without full graph
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
        // Return a simplified graph (just file -> dependencies) to save tokens
        const simplifiedGraph: Record<string, string[]> = {};
        for (const [path, node] of Object.entries(projectMap.dependencyGraph)) {
          simplifiedGraph[path] = node.imports.filter(
            i => i.startsWith('.') || i.startsWith('@/')
          );
        }
        result.dependencyGraph = simplifiedGraph;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
