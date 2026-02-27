import dynamic from 'next/dynamic';

/**
 * CodeForge IDE — Monaco Dynamic Loader
 *
 * CRITICAL FIX: @monaco-editor/react loads Monaco from cdn.jsdelivr.net
 * by default, but our CSP blocks external scripts (script-src 'self').
 *
 * Solution: Configure the loader to use the local monaco-editor package
 * from node_modules. We do this inside the dynamically-imported component
 * to avoid SSR — monaco-editor requires `window` which doesn't exist
 * on the server.
 *
 * Flow:
 * 1. monaco-loader.tsx exports a dynamic() component with ssr:false
 * 2. When loaded client-side, monaco-init-wrapper.tsx runs
 * 3. It calls loader.config({ monaco }) with the local package
 * 4. Then renders <MonacoEditorInner /> which uses @monaco-editor/react
 */
export const MonacoEditor = dynamic(
  () => import('@/lib/utils/monaco-init-wrapper'),
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
