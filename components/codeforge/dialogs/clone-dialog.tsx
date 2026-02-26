/**
 * CodeForge IDE — Clone Repository Dialog
 * Professional clone modal with progress tracking.
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { cloneRepository } from '@/lib/services/github.service';
import { GitBranch, Loader2, AlertCircle, CheckCircle, Github } from 'lucide-react';

interface CloneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloneDialog({ open, onOpenChange }: CloneDialogProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [progress, setProgress] = useState({ msg: '', pct: 0 });
  const [cloneError, setCloneError] = useState<string | null>(null);

  const { token, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();

  /** Parse owner/repo from various URL formats */
  const parseRepo = (input: string): { owner: string; repo: string } | null => {
    // Handle: https://github.com/owner/repo(.git)
    const urlMatch = input.match(
      /github\.com\/([\w.-]+)\/([\.\w-]+?)(?:\.git)?\/?$/
    );
    if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };

    // Handle: owner/repo
    const shortMatch = input.match(/^([\w.-]+)\/([\.\w-]+)$/);
    if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };

    return null;
  };

  const handleClone = async () => {
    if (!token) return;

    const parsed = parseRepo(repoUrl.trim());
    if (!parsed) {
      setCloneError('الصيغة غير صحيحة. استخدم: owner/repo أو رابط GitHub كامل');
      return;
    }

    setIsCloning(true);
    setCloneError(null);
    setProgress({ msg: 'بدء الاستنساخ…', pct: 0 });

    try {
      const result = await cloneRepository(
        parsed.owner,
        parsed.repo,
        token,
        branch || undefined,
        (msg, pct) => setProgress({ msg, pct })
      );

      addNotification({
        type: 'success',
        title: 'تم الاستنساخ بنجاح!',
        message: `تم جلب ${result.imported} ملف من ${result.repoName}`,
        autoDismiss: true,
        dismissAfterMs: 6000,
      });

      setRepoUrl('');
      setBranch('');
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل الاستنساخ';
      setCloneError(msg);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Clone Repository
          </DialogTitle>
          <DialogDescription>
            استنسخ مستودع من GitHub إلى المحرر.
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium text-sm">تسجيل الدخول مطلوب</span>
            </div>
            <p className="text-xs text-muted-foreground">
              يجب تسجيل الدخول بـ GitHub أولاً لاستنساخ المستودعات.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="clone-url" className="text-sm font-medium">
                Repository URL or owner/repo
              </label>
              <input
                id="clone-url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleClone()}
                placeholder="e.g. facebook/react or https://github.com/facebook/react"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isCloning}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="clone-branch" className="text-sm font-medium">
                Branch <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="clone-branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="default branch"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isCloning}
              />
            </div>

            {cloneError && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{cloneError}</span>
              </div>
            )}

            {isCloning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{progress.msg}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress.pct}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleClone}
              disabled={!repoUrl.trim() || isCloning}
              className="w-full"
            >
              {isCloning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الاستنساخ… {progress.pct}%
                </>
              ) : (
                <>
                  <Github className="mr-2 h-4 w-4" />
                  Clone
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
