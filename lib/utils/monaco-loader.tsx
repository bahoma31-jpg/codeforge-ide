'use client';

/**
 * CodeForge IDE — Monaco Dynamic Loader
 *
 * CRITICAL FIX: @monaco-editor/react by default loads Monaco from
 * cdn.jsdelivr.net. But our CSP (Content-Security-Policy) has:
 *   script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:
 *
 * This BLOCKS all scripts from cdn.jsdelivr.net, so Monaco never loads
 * and the editor stays stuck on "loading..." forever.
 *
 * Solution: Import monaco-editor from node_modules (already installed)
 * and tell @monaco-editor/react to use it instead of fetching from CDN.
 * This makes Monaco load from 'self' — fully CSP-compliant.
 */

import dynamic from 'next/dynamic';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Tell @monaco-editor/react to use our local monaco instance
// instead of downloading from cdn.jsdelivr.net
loader.config({ monaco });

export const MonacoEditor = dynamic(
  () => import('@/components/codeforge/editor/monaco-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Loading Monaco Editor...
          </p>
        </div>
      </div>
    ),
  }
);
