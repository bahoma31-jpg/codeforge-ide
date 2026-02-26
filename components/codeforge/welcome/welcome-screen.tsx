'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FolderOpen,
  GitBranch,
  FileText,
  Book,
  Keyboard,
  Github,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useNotificationStore } from '@/lib/stores/notification-store';

/** Docs that can be opened inside the editor */
const DOCS = {
  architecture: {
    name: 'architecture.md',
    path: '/docs/architecture.md',
    language: 'markdown',
  },
  git: {
    name: 'git-integration.md',
    path: '/docs/git-integration.md',
    language: 'markdown',
  },
  shortcuts: {
    name: 'keyboard-shortcuts.md',
    path: '/docs/keyboard-shortcuts.md',
    language: 'markdown',
  },
} as const;

export function WelcomeScreen() {
  const { openFile } = useEditorStore();
  const { addNotification } = useNotificationStore();

  const notifyUnimplemented = (feature: string) => {
    addNotification({
      type: 'warning',
      title: 'قيد التطوير',
      message: `ميزة "${feature}" لم تُبنى بعد — ستتوفر في إصدار قادم.`,
      autoDismiss: true,
      dismissAfterMs: 4000,
    });
  };

  const openDocInEditor = (doc: (typeof DOCS)[keyof typeof DOCS]) => {
    openFile({
      id: `doc-${doc.path}`,
      name: doc.name,
      content: `# ${doc.name}\n\nLoading documentation...`,
      language: doc.language,
      path: doc.path,
    });
  };

  const recentProjects = [
    {
      name: 'my-project',
      path: '/projects/my-project',
      lastOpened: '2 hours ago',
    },
    { name: 'web-app', path: '/projects/web-app', lastOpened: '1 day ago' },
    {
      name: 'api-server',
      path: '/projects/api-server',
      lastOpened: '3 days ago',
    },
  ];

  return (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="w-full max-w-4xl p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <svg
              className="w-16 h-16"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="100"
                height="100"
                rx="20"
                fill="currentColor"
                className="text-primary"
              />
              <path
                d="M30 40 L50 60 L70 40"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h1 className="text-4xl font-bold">CodeForge IDE</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            محرر أكواد متكامل في المتصفح مع دعم كامل لـ Git
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quick Start
            </h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={() => notifyUnimplemented('Open Folder')}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Open Folder
                <AlertTriangle className="w-3 h-3 ml-auto text-red-500" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={() => notifyUnimplemented('Clone Repository')}
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Clone Repository
                <AlertTriangle className="w-3 h-3 ml-auto text-red-500" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  openFile({
                    id: crypto.randomUUID(),
                    name: 'untitled',
                    content: '',
                    language: 'plaintext',
                    path: '/untitled',
                  })
                }
              >
                <FileText className="w-4 h-4 mr-2" />
                New File
              </Button>
            </div>
          </Card>

          {/* Recent Projects */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Projects
            </h2>
            <div className="space-y-2">
              {recentProjects.map((project) => (
                <Button
                  key={project.path}
                  variant="ghost"
                  className="w-full justify-start border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => notifyUnimplemented(`Open project: ${project.name}`)}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-xs text-red-400/60">
                      {project.path}
                    </p>
                  </div>
                  <span className="text-xs text-red-400/60">
                    {project.lastOpened}
                  </span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Getting Started — opens docs in editor */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Book className="w-5 h-5" />
              Getting Started
            </h2>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => openDocInEditor(DOCS.architecture)}
              >
                <Book className="w-4 h-4 mr-2" />
                Architecture Guide
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => openDocInEditor(DOCS.git)}
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Git Integration Guide
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => openDocInEditor(DOCS.shortcuts)}
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Keyboard Shortcuts
              </Button>
            </div>
          </Card>

          {/* GitHub Connection */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Github className="w-5 h-5" />
              Connect to GitHub
            </h2>
            <p className="text-sm text-muted-foreground">
              قم بتسجيل الدخول لمزامنة المشاريع والوصول إلى المستودعات
            </p>
            <Button
              className="w-full border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              onClick={() => notifyUnimplemented('Sign in with GitHub')}
            >
              <Github className="w-4 h-4 mr-2" />
              Sign in with GitHub
              <AlertTriangle className="w-3 h-3 ml-2 text-red-500" />
            </Button>
          </Card>
        </div>

        {/* Hints */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Press{' '}
            <kbd className="px-2 py-1 mx-1 text-xs font-mono border rounded bg-muted">
              Ctrl+P
            </kbd>{' '}
            for Quick Open or{' '}
            <kbd className="px-2 py-1 mx-1 text-xs font-mono border rounded bg-muted">
              ?
            </kbd>{' '}
            for Keyboard Shortcuts
          </p>
          <p className="text-xs text-red-400/70 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            الأزرار باللون الأحمر لم تُبنَ بعد — ستتوفر في إصدار قادم
          </p>
        </div>
      </div>
    </div>
  );
}
