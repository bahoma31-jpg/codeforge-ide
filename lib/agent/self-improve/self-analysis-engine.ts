/**
 * CodeForge IDE — Self-Analysis Engine
 * Core engine that reads and analyzes project files,
 * builds dependency graphs, and identifies component relationships.
 *
 * This is the "brain" that gives the agent awareness of its own codebase.
 */

import type {
  ComponentAnalysis,
  DependencyNode,
  DependencyTrace,
  DependencyTreeNode,
  ProjectMap,
} from './types';

// ─── Import/Export Parsing ────────────────────────────────────

/** Extract import statements from TypeScript/JavaScript source code */
function parseImports(
  content: string
): Array<{ source: string; symbols: string[] }> {
  const imports: Array<{ source: string; symbols: string[] }> = [];
  const importRegex =
    /import\s+(?:(?:\{([^}]*)\})|(?:(\w+))(?:\s*,\s*\{([^}]*)\})?)\s+from\s+['"]([^'"]+)['"]/g;
  const sideEffectImport = /import\s+['"]([^'"]+)['"]/g;
  const typeImportRegex =
    /import\s+type\s+(?:\{([^}]*)\})\s+from\s+['"]([^'"]+)['"]/g;

  let match;

  // Named imports: import { A, B } from 'x'
  // Default imports: import X from 'x'
  // Mixed: import X, { A, B } from 'x'
  while ((match = importRegex.exec(content)) !== null) {
    const namedSymbols = match[1] || match[3] || '';
    const defaultSymbol = match[2] || '';
    const source = match[4];
    const symbols: string[] = [];

    if (defaultSymbol) symbols.push(defaultSymbol);
    if (namedSymbols) {
      symbols.push(
        ...namedSymbols
          .split(',')
          .map((s) => s.trim().split(' as ')[0].trim())
          .filter(Boolean)
      );
    }

    imports.push({ source, symbols });
  }

  // Type imports: import type { A } from 'x'
  while ((match = typeImportRegex.exec(content)) !== null) {
    const symbols = match[1]
      .split(',')
      .map((s) => s.trim().split(' as ')[0].trim())
      .filter(Boolean);
    imports.push({ source: match[2], symbols });
  }

  // Side-effect imports: import 'x'
  while ((match = sideEffectImport.exec(content)) !== null) {
    // Avoid duplicates from previous regex
    if (!imports.some((i) => i.source === match![1])) {
      imports.push({ source: match[1], symbols: [] });
    }
  }

  return imports;
}

/** Extract exported symbols from TypeScript/JavaScript source code */
function parseExports(content: string): string[] {
  const exports: string[] = [];
  const patterns = [
    /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/g,
    /export\s+default\s+(\w+)/g,
    /export\s+\{([^}]*)\}/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (pattern === patterns[2]) {
        // export { A, B, C }
        exports.push(
          ...match[1]
            .split(',')
            .map((s) => s.trim().split(' as ')[0].trim())
            .filter(Boolean)
        );
      } else {
        exports.push(match[1]);
      }
    }
  }

  return [...new Set(exports)];
}

/** Detect the type of a component/file from its content */
function detectComponentType(
  filePath: string,
  content: string
): ComponentAnalysis['type'] {
  const lower = filePath.toLowerCase();

  if (
    lower.includes('.test.') ||
    lower.includes('.spec.') ||
    lower.includes('__tests__')
  )
    return 'test';
  if (
    lower.endsWith('.css') ||
    lower.endsWith('.scss') ||
    lower.endsWith('.module.css')
  )
    return 'style';
  if (lower.includes('/types') || lower.endsWith('.d.ts'))
    return 'type_definition';
  if (lower.includes('config') || lower.includes('.config.')) return 'config';
  if (lower.includes('/stores/') || lower.includes('-store')) return 'store';
  if (lower.includes('/hooks/') || lower.includes('use-')) return 'hook';
  if (lower.includes('-service') || lower.includes('/services/'))
    return 'service';

  // Check content for React component patterns
  if (
    content.includes('React') ||
    content.includes('jsx') ||
    (/export\s+(?:default\s+)?function\s+\w+.*\(/.test(content) &&
      content.includes('return ('))
  ) {
    return 'react_component';
  }

  return 'utility';
}

/** Extract React props from a component file */
function extractProps(content: string): string[] {
  const propsMatch = content.match(/interface\s+\w*Props\s*\{([^}]*)\}/s);
  if (!propsMatch) return [];

  return propsMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'))
    .map((line) => line.split(':')[0]?.replace('?', '').trim())
    .filter(Boolean);
}

/** Extract Zustand/React state usage */
function extractStateUsage(content: string): string[] {
  const statePatterns: string[] = [];

  // useState hooks
  const useStateRegex = /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState/g;
  let match;
  while ((match = useStateRegex.exec(content)) !== null) {
    statePatterns.push(`useState:${match[1]}`);
  }

  // Zustand store usage
  const zustandRegex = /use(\w+Store)/g;
  while ((match = zustandRegex.exec(content)) !== null) {
    statePatterns.push(`zustand:${match[1]}`);
  }

  return statePatterns;
}

/** Estimate code complexity based on heuristics */
function estimateComplexity(content: string): 'low' | 'medium' | 'high' {
  const lines = content.split('\n').length;
  const conditionals = (content.match(/if\s*\(|\?\s*[^:]/g) || []).length;
  const loops = (
    content.match(/for\s*\(|while\s*\(|\.map\(|\.forEach\(|\.reduce\(/g) || []
  ).length;
  const callbacks = (content.match(/=>|function\s/g) || []).length;

  const score =
    conditionals * 2 + loops * 3 + callbacks * 1 + (lines > 200 ? 10 : 0);

  if (score > 30) return 'high';
  if (score > 12) return 'medium';
  return 'low';
}

// ─── Self-Analysis Engine ─────────────────────────────────────

/**
 * SelfAnalysisEngine — The core analysis engine.
 *
 * Provides methods to:
 * - Analyze individual components
 * - Trace dependency chains
 * - Build project maps
 * - Find related files for a given issue
 */
export class SelfAnalysisEngine {
  private projectMap: ProjectMap | null = null;
  private analysisCache: Map<string, ComponentAnalysis> = new Map();

  /**
   * Analyze a single component file.
   * Returns detailed information about its structure, imports, exports, and complexity.
   */
  analyzeComponent(filePath: string, content: string): ComponentAnalysis {
    // Check cache first
    const cached = this.analysisCache.get(filePath);
    if (cached) return cached;

    const imports = parseImports(content);
    const exports = parseExports(content);
    const type = detectComponentType(filePath, content);
    const props =
      type === 'react_component' ? extractProps(content) : undefined;
    const stateUsage =
      type === 'react_component' || type === 'hook'
        ? extractStateUsage(content)
        : undefined;
    const lineCount = content.split('\n').length;
    const complexity = estimateComplexity(content);

    // Extract component name from path
    const fileName = filePath.split('/').pop() || '';
    const componentName = fileName.replace(/\.(ts|tsx|js|jsx)$/, '');

    // Resolve dependencies (relative imports)
    const dependencies = imports
      .map((i) => i.source)
      .filter((s) => s.startsWith('.') || s.startsWith('@/'));

    const analysis: ComponentAnalysis = {
      filePath,
      componentName,
      type,
      imports,
      exports,
      dependencies,
      dependents: [], // Filled later by buildProjectMap
      props,
      stateUsage,
      estimatedComplexity: complexity,
      lineCount,
      hasTests: false, // Will be determined by checking test files
    };

    this.analysisCache.set(filePath, analysis);
    return analysis;
  }

  /**
   * Trace the dependency chain for a given file.
   * Shows what it depends on (upstream) and what depends on it (downstream).
   */
  traceDependencies(
    filePath: string,
    allFiles: Map<string, string>,
    maxDepth: number = 5
  ): DependencyTrace {
    const upstream: Set<string> = new Set();
    const downstream: Set<string> = new Set();
    const circularDeps: string[] = [];

    // Get the target file's imports
    const targetContent = allFiles.get(filePath);
    if (!targetContent) {
      return {
        rootFile: filePath,
        depth: 0,
        upstream: [],
        downstream: [],
        circularDeps: [],
        traceTree: { filePath, children: [], depth: 0, isCircular: false },
      };
    }

    const targetImports = parseImports(targetContent);

    // Resolve upstream (files this file imports)
    for (const imp of targetImports) {
      const resolved = this.resolveImportPath(filePath, imp.source, allFiles);
      if (resolved) upstream.add(resolved);
    }

    // Resolve downstream (files that import this file)
    for (const [otherPath, otherContent] of allFiles.entries()) {
      if (otherPath === filePath) continue;
      const otherImports = parseImports(otherContent);
      for (const imp of otherImports) {
        const resolved = this.resolveImportPath(
          otherPath,
          imp.source,
          allFiles
        );
        if (resolved === filePath) {
          downstream.add(otherPath);
        }
      }
    }

    // Check for circular dependencies
    for (const up of upstream) {
      if (downstream.has(up)) {
        circularDeps.push(up);
      }
    }

    // Build trace tree
    const traceTree = this.buildTraceTree(
      filePath,
      allFiles,
      maxDepth,
      new Set()
    );

    return {
      rootFile: filePath,
      depth: maxDepth,
      upstream: Array.from(upstream),
      downstream: Array.from(downstream),
      circularDeps,
      traceTree,
    };
  }

  /**
   * Build a complete project map with dependency graph.
   */
  buildProjectMap(
    allFiles: Map<string, string>,
    projectRoot: string = '/'
  ): ProjectMap {
    const dependencyGraph: Record<string, DependencyNode> = {};
    const filesByExtension: Record<string, number> = {};
    const entryPoints: string[] = [];
    const configFiles: string[] = [];
    const componentFiles: string[] = [];
    let totalFolders = 0;

    // Track unique folders
    const folders = new Set<string>();

    for (const [filePath, content] of allFiles.entries()) {
      // Count extensions
      const ext = filePath.split('.').pop() || 'unknown';
      filesByExtension[ext] = (filesByExtension[ext] || 0) + 1;

      // Track folders
      const parts = filePath.split('/');
      for (let i = 1; i < parts.length; i++) {
        folders.add(parts.slice(0, i).join('/'));
      }

      // Parse imports and exports
      const imports = parseImports(content);
      const exports = parseExports(content);

      dependencyGraph[filePath] = {
        filePath,
        imports: imports.map((i) => i.source),
        exportedSymbols: exports,
        importedBy: [], // Filled in second pass
        language: ext,
        size: content.length,
      };

      // Categorize
      if (
        filePath.includes('page.tsx') ||
        filePath.includes('layout.tsx') ||
        filePath === 'app/page.tsx'
      ) {
        entryPoints.push(filePath);
      }
      if (
        filePath.includes('.config.') ||
        filePath === 'package.json' ||
        filePath === 'tsconfig.json'
      ) {
        configFiles.push(filePath);
      }
      if (filePath.includes('/components/') || filePath.endsWith('.tsx')) {
        componentFiles.push(filePath);
      }
    }

    // Second pass: fill importedBy
    for (const [filePath, node] of Object.entries(dependencyGraph)) {
      for (const imp of node.imports) {
        const resolved = this.resolveImportPath(filePath, imp, allFiles);
        if (resolved && dependencyGraph[resolved]) {
          dependencyGraph[resolved].importedBy.push(filePath);
        }
      }
    }

    totalFolders = folders.size;

    this.projectMap = {
      rootPath: projectRoot,
      totalFiles: allFiles.size,
      totalFolders,
      filesByExtension,
      dependencyGraph,
      entryPoints,
      configFiles,
      componentFiles,
      buildTimestamp: Date.now(),
    };

    return this.projectMap;
  }

  /**
   * Find files that are likely related to a described issue area.
   * Uses keyword matching against file paths and content.
   */
  findRelatedFiles(
    issueDescription: string,
    allFiles: Map<string, string>,
    maxResults: number = 10
  ): Array<{ filePath: string; relevanceScore: number; reason: string }> {
    const keywords = issueDescription
      .toLowerCase()
      .split(/[\s,.;:!?()\[\]{}]+/)
      .filter((k) => k.length > 2);

    const results: Array<{
      filePath: string;
      relevanceScore: number;
      reason: string;
    }> = [];

    // UI-related keyword mappings
    const areaKeywords: Record<string, string[]> = {
      sidebar: ['sidebar', 'file-explorer', 'panel', 'activity-bar'],
      editor: ['editor', 'monaco', 'tab', 'code-editor'],
      terminal: ['terminal', 'console', 'output'],
      header: ['header', 'menu-bar', 'title-bar', 'toolbar'],
      status: ['status-bar', 'footer', 'status'],
      dialog: ['dialog', 'modal', 'popup'],
      settings: ['settings', 'config', 'preferences'],
      agent: ['agent', 'chat', 'ai', 'assistant'],
      git: ['git', 'source-control', 'version'],
      left: ['sidebar', 'file-explorer', 'activity-bar', 'panel'],
      right: ['panel', 'agent', 'chat'],
      bottom: ['terminal', 'output', 'status-bar', 'problems'],
      top: ['header', 'menu-bar', 'title-bar', 'toolbar'],
      button: ['button', 'btn', 'action', 'click'],
      layout: ['layout', 'grid', 'flex', 'resize', 'split'],
      واجهة: ['layout', 'ui', 'component', 'panel'],
      يسرى: ['sidebar', 'file-explorer', 'activity-bar', 'panel'],
      يمنى: ['panel', 'agent', 'chat'],
      زاوية: ['corner', 'sidebar', 'panel', 'layout'],
      أزرار: ['button', 'btn', 'action', 'icon'],
    };

    for (const [filePath, content] of allFiles.entries()) {
      let score = 0;
      const reasons: string[] = [];

      // Check file path against keywords
      const lowerPath = filePath.toLowerCase();
      for (const keyword of keywords) {
        // Direct path match
        if (lowerPath.includes(keyword)) {
          score += 5;
          reasons.push(`path contains "${keyword}"`);
        }

        // Area-based matching
        const mappedKeywords = areaKeywords[keyword];
        if (mappedKeywords) {
          for (const mapped of mappedKeywords) {
            if (lowerPath.includes(mapped)) {
              score += 4;
              reasons.push(`area match: "${keyword}" → "${mapped}"`);
            }
          }
        }
      }

      // Check content for keyword presence
      const lowerContent = content.toLowerCase();
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword)) {
          score += 1;
        }
      }

      // Boost UI files for UI-related issues
      if (
        keywords.some((k) =>
          ['ui', 'واجهة', 'button', 'أزرار', 'layout', 'style', 'css'].includes(
            k
          )
        )
      ) {
        if (filePath.endsWith('.tsx') || filePath.endsWith('.css')) score += 2;
      }

      if (score > 0) {
        results.push({
          filePath,
          relevanceScore: score,
          reason: reasons.join('; ') || 'keyword match in content',
        });
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /** Get cached project map */
  getProjectMap(): ProjectMap | null {
    return this.projectMap;
  }

  /** Clear analysis cache */
  clearCache(): void {
    this.analysisCache.clear();
    this.projectMap = null;
  }

  // ─── Private Helpers ──────────────────────────────────────

  /**
   * Resolve a relative import path to an absolute file path.
   * Handles: ./relative, ../parent, @/alias paths.
   */
  private resolveImportPath(
    fromFile: string,
    importSource: string,
    allFiles: Map<string, string>
  ): string | null {
    // Skip node_modules imports
    if (!importSource.startsWith('.') && !importSource.startsWith('@/')) {
      return null;
    }

    let resolvedBase: string;

    if (importSource.startsWith('@/')) {
      // Alias: @/ maps to project root
      resolvedBase = importSource.replace('@/', '');
    } else {
      // Relative import
      const fromDir = fromFile.split('/').slice(0, -1).join('/');
      const parts = importSource.split('/');
      const baseParts = fromDir.split('/').filter(Boolean);

      for (const part of parts) {
        if (part === '..') baseParts.pop();
        else if (part !== '.') baseParts.push(part);
      }

      resolvedBase = baseParts.join('/');
    }

    // Try different extensions
    const extensions = [
      '',
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '/index.ts',
      '/index.tsx',
      '/index.js',
    ];
    for (const ext of extensions) {
      const candidate = resolvedBase + ext;
      if (allFiles.has(candidate)) return candidate;
    }

    return null;
  }

  /**
   * Build a dependency tree recursively for visualization.
   */
  private buildTraceTree(
    filePath: string,
    allFiles: Map<string, string>,
    maxDepth: number,
    visited: Set<string>,
    currentDepth: number = 0
  ): DependencyTreeNode {
    const isCircular = visited.has(filePath);
    const node: DependencyTreeNode = {
      filePath,
      children: [],
      depth: currentDepth,
      isCircular,
    };

    if (isCircular || currentDepth >= maxDepth) return node;

    visited.add(filePath);
    const content = allFiles.get(filePath);
    if (!content) return node;

    const imports = parseImports(content);
    for (const imp of imports) {
      const resolved = this.resolveImportPath(filePath, imp.source, allFiles);
      if (resolved) {
        node.children.push(
          this.buildTraceTree(
            resolved,
            allFiles,
            maxDepth,
            new Set(visited),
            currentDepth + 1
          )
        );
      }
    }

    return node;
  }
}

// ─── Singleton Instance ───────────────────────────────────────

let engineInstance: SelfAnalysisEngine | null = null;

export function getSelfAnalysisEngine(): SelfAnalysisEngine {
  if (!engineInstance) {
    engineInstance = new SelfAnalysisEngine();
  }
  return engineInstance;
}
