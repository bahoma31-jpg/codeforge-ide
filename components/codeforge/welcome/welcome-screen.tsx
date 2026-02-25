'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FolderOpen,
  GitBranch,
  FileText,
  Book,
  Keyboard,
  Github,
  Clock,
  Code2,
  Terminal,
  Settings,
} from 'lucide-react';

interface WelcomeScreenProps {
  onOpenFolder?: () => void;
  onCloneRepository?: () => void;
  onNewFile?: () => void;
  onOpenProject?: (path: string) => void;
  onSignInGitHub?: () => void;
  onOpenShortcuts?: () => void;
}

export function WelcomeScreen({
  onOpenFolder,
  onCloneRepository,
  onNewFile,
  onOpenProject,
  onSignInGitHub,
  onOpenShortcuts,
}: WelcomeScreenProps) {
  const recentProjects = [
    { 
      name: 'my-project', 
      path: '/projects/my-project', 
      lastOpened: '2 hours ago',
      description: 'React + TypeScript project'
    },
    { 
      name: 'web-app', 
      path: '/projects/web-app', 
      lastOpened: '1 day ago',
      description: 'Next.js application'
    },
    { 
      name: 'api-server', 
      path: '/projects/api-server', 
      lastOpened: '3 days ago',
      description: 'Node.js REST API'
    },
  ];

  const gettingStartedLinks = [
    {
      icon: Book,
      title: 'Architecture Guide',
      description: 'نظرة عامة على البنية المعمارية',
      link: '/docs/architecture.md',
    },
    {
      icon: GitBranch,
      title: 'Git Integration',
      description: 'دليل التكامل مع GitHub',
      link: '/docs/git-integration.md',
    },
    {
      icon: Terminal,
      title: 'Terminal Commands',
      description: 'قائمة الأوامر المدعومة',
      link: '/docs/terminal-commands.md',
    },
    {
      icon: Keyboard,
      title: 'Keyboard Shortcuts',
      description: 'اختصارات لوحة المفاتيح',
      action: onOpenShortcuts,
    },
  ];

  return (
    <div className="flex items-center justify-center h-full bg-background p-8 overflow-auto">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <Code2 className="w-16 h-16 text-primary relative" strokeWidth={1.5} />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                CodeForge IDE
              </h1>
              <p className="text-sm text-muted-foreground mt-1">v1.0.0</p>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            محرر أكواد متكامل في المتصفح مع دعم كامل لـ Git والمحطة الطرفية
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Quick Start
              </CardTitle>
              <CardDescription>ابدأ بسرعة مع مشروعك الجديد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-primary/5 hover:border-primary/50"
                onClick={onOpenFolder}
              >
                <FolderOpen className="w-5 h-5 mr-3 text-primary" />
                <div className="text-left flex-1">
                  <p className="font-medium">Open Folder</p>
                  <p className="text-xs text-muted-foreground">فتح مجلد موجود</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-primary/5 hover:border-primary/50"
                onClick={onCloneRepository}
              >
                <GitBranch className="w-5 h-5 mr-3 text-primary" />
                <div className="text-left flex-1">
                  <p className="font-medium">Clone Repository</p>
                  <p className="text-xs text-muted-foreground">استنساخ مستودع من GitHub</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-primary/5 hover:border-primary/50"
                onClick={onNewFile}
              >
                <FileText className="w-5 h-5 mr-3 text-primary" />
                <div className="text-left flex-1">
                  <p className="font-medium">New File</p>
                  <p className="text-xs text-muted-foreground">إنشاء ملف جديد</p>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Projects
              </CardTitle>
              <CardDescription>آخر المشاريع المفتوحة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <Button
                    key={project.path}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3 hover:bg-primary/5"
                    onClick={() => onOpenProject?.(project.path)}
                  >
                    <FolderOpen className="w-5 h-5 mr-3 text-muted-foreground" />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{project.lastOpened}</span>
                  </Button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent projects</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                Getting Started
              </CardTitle>
              <CardDescription>تعلم كيفية استخدام CodeForge IDE</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {gettingStartedLinks.map((item) => (
                <Button
                  key={item.title}
                  variant="ghost"
                  className="w-full justify-start h-auto py-3 hover:bg-primary/5"
                  onClick={() => item.action ? item.action() : window.open(item.link, '_blank')}
                >
                  <item.icon className="w-5 h-5 mr-3 text-muted-foreground" />
                  <div className="text-left flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* GitHub Connection */}
          <Card className="border-2 border-primary/30 bg-primary/5 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5 text-primary" />
                Connect to GitHub
              </CardTitle>
              <CardDescription>قم بتسجيل الدخول لمزامنة المشاريع</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• الوصول الكامل للمستودعات</p>
                <p>• مزامنة تلقائية مع GitHub</p>
                <p>• إدارة الفروع والـ Pull Requests</p>
                <p>• عمليات Git محلية وبعيدة</p>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={onSignInGitHub}
              >
                <Github className="w-4 h-4 mr-2" />
                Sign in with GitHub
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Hints */}
        <div className="text-center space-y-3 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Press{' '}
            <kbd className="px-2 py-1 mx-1 text-xs font-mono border rounded bg-muted">Ctrl+P</kbd>{' '}
            for Quick Open or{' '}
            <kbd className="px-2 py-1 mx-1 text-xs font-mono border rounded bg-muted">?</kbd>{' '}
            for Keyboard Shortcuts
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <a href="https://github.com/bahoma31-jpg/codeforge-ide" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              GitHub Repository
            </a>
            <span>•</span>
            <a href="/docs" target="_blank" className="hover:text-primary transition-colors">
              Documentation
            </a>
            <span>•</span>
            <a href="/CONTRIBUTING.md" target="_blank" className="hover:text-primary transition-colors">
              Contributing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
