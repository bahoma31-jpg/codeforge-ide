'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, GitBranch, File, BookOpen, Keyboard, Github } from 'lucide-react';
import KeyboardShortcutsDialog from '../help/keyboard-shortcuts-dialog';

interface RecentProject {
  id: string;
  name: string;
  path: string;
  lastOpened: Date;
}

export default function WelcomeScreen() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // This would come from storage in a real app
  const recentProjects: RecentProject[] = [
    {
      id: '1',
      name: 'my-project',
      path: '/projects/my-project',
      lastOpened: new Date('2026-02-24'),
    },
    {
      id: '2',
      name: 'website',
      path: '/projects/website',
      lastOpened: new Date('2026-02-23'),
    },
  ];

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full p-8 space-y-8">
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <svg
              className="w-12 h-12 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <h1 className="text-4xl font-bold">CodeForge IDE</h1>
          </div>
          <p className="text-muted-foreground">
            A modern, full-featured web-based code editor
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <FolderOpen className="w-8 h-8 mb-2 text-primary" />
              <CardTitle>Open Folder</CardTitle>
              <CardDescription>
                Browse and open a folder from your local files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Open Folder
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <GitBranch className="w-8 h-8 mb-2 text-primary" />
              <CardTitle>Clone Repository</CardTitle>
              <CardDescription>
                Clone a repository from GitHub or other Git providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Github className="mr-2 h-4 w-4" />
                Clone from GitHub
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <File className="w-8 h-8 mb-2 text-primary" />
              <CardTitle>New File</CardTitle>
              <CardDescription>
                Start with a blank file and create something new
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                New File
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Continue where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-muted cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.path}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.lastOpened.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Getting Started Links */}
        <div className="flex items-center gap-4 text-sm">
          <Button variant="link" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Documentation
          </Button>
          <Button
            variant="link"
            className="gap-2"
            onClick={() => setShowShortcuts(true)}
          >
            <Keyboard className="h-4 w-4" />
            Keyboard Shortcuts
          </Button>
          <Button variant="link" className="gap-2">
            <Github className="h-4 w-4" />
            View on GitHub
          </Button>
        </div>
      </div>

      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />
    </>
  );
}
