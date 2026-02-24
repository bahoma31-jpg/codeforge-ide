export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-24">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">
            \uD83D\uDE80 CodeForge IDE
          </h1>
          <p className="text-xl text-muted-foreground">
            A modern, web-based code editor inspired by VS Code
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Infrastructure Setup Complete!
          </h2>
          <div className="text-sm text-muted-foreground space-y-2 text-left">
            <p>\u2705 Next.js 14 + TypeScript + App Router</p>
            <p>\u2705 Tailwind CSS + shadcn/ui</p>
            <p>\u2705 ESLint + Prettier</p>
            <p>\u2705 Vitest Testing Framework</p>
            <p>\u2705 Zustand State Management</p>
            <p>\u2705 Project Structure Ready</p>
            <p>\u2705 GitHub Repository Published</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Version 0.1.0 | Agent 1: Infrastructure \u2705
        </p>
      </div>
    </main>
  );
}
