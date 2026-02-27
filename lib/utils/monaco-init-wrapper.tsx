'use client';

/**
 * CodeForge IDE — Monaco Init Wrapper
 *
 * This file is loaded ONLY on the client (via dynamic import with ssr:false
 * in monaco-loader.tsx). It's safe to import monaco-editor here because
 * `window` exists in the browser.
 *
 * It configures @monaco-editor/react to use our local monaco-editor
 * package instead of fetching from cdn.jsdelivr.net (blocked by CSP).
 */

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import MonacoEditorInner from '@/components/codeforge/editor/monaco-editor';

// Configure loader to use local monaco — runs only in browser
loader.config({ monaco });

export default MonacoEditorInner;
