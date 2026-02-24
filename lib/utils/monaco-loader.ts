import dynamic from "next/dynamic";

export const MonacoEditor = dynamic(
  () => import("@/components/codeforge/editor/monaco-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Monaco Editor...</p>
        </div>
      </div>
    ),
  }
);
