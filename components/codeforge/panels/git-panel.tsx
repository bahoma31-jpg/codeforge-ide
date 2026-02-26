/**
 * CodeForge IDE — Git Source Control Panel
 * Professional source control UI with stage/unstage, commit, push, pull.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGitStore, type TrackedChange } from '@/lib/stores/git-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import {
  GitBranch,
  Upload,
  Download,
  Plus,
  Minus,
  Edit3,
  Trash2,
  FileText,
  Check,
  CheckCheck,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Github,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** Status icon + color for each change type */
function StatusBadge({ status }: { status: TrackedChange['status'] }) {
  const config = {
    modified: { icon: Edit3, color: 'text-yellow-500', label: 'M' },
    added: { icon: Plus, color: 'text-green-500', label: 'A' },
    deleted: { icon: Trash2, color: 'text-red-500', label: 'D' },
  };
  const { icon: Icon, color, label } = config[status];
  return (
    <span className={cn('flex items-center gap-1 text-xs font-mono', color)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function GitPanel() {
  const {
    repoContext,
    changes,
    commitMessage,
    isPushing,
    isPulling,
    pushProgress,
    pullProgress,
    lastPushResult,
    error,
    detectChanges,
    stageFile,
    unstageFile,
    stageAll,
    unstageAll,
    setCommitMessage,
    push,
    pull,
    clearError,
  } = useGitStore();

  const { isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();

  // Auto-detect changes on mount and periodically
  useEffect(() => {
    detectChanges();
    const interval = setInterval(detectChanges, 5000); // every 5s
    return () => clearInterval(interval);
  }, [detectChanges]);

  const stagedChanges = changes.filter((c) => c.staged);
  const unstagedChanges = changes.filter((c) => !c.staged);

  const handlePush = useCallback(async () => {
    try {
      const result = await push();
      addNotification({
        type: 'success',
        title: 'تم الدفع بنجاح!',
        message: `Commit ${result.sha.slice(0, 7)}: ${result.files_changed} ملف`,
        autoDismiss: true,
        dismissAfterMs: 6000,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'فشل الدفع',
        message: err instanceof Error ? err.message : 'خطأ غير متوقع',
        autoDismiss: false,
      });
    }
  }, [push, addNotification]);

  const handlePull = useCallback(async () => {
    try {
      await pull();
      addNotification({
        type: 'success',
        title: 'تم السحب بنجاح!',
        message: 'تم تحديث الملفات من المستودع.',
        autoDismiss: true,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'فشل السحب',
        message: err instanceof Error ? err.message : 'خطأ غير متوقع',
        autoDismiss: false,
      });
    }
  }, [pull, addNotification]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (stagedChanges.length > 0 && commitMessage.trim()) {
        handlePush();
      }
    }
  };

  // ─── Not Connected ──────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
        <Github className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          سجّل الدخول بـ GitHub للوصول إلى Source Control
        </p>
      </div>
    );
  }

  if (!repoContext) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
        <GitBranch className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          استنسخ مستودعاً لتفعيل Source Control
        </p>
      </div>
    );
  }

  // ─── Connected ──────────────────────────────────
  return (
    <div className="flex flex-col h-full text-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <span className="font-medium">{repoContext.owner}/{repoContext.repo}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {repoContext.branch}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => detectChanges()}
            title="تحديث التغييرات"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 border-b bg-destructive/10 px-3 py-2">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />
          <div className="flex-1 text-xs text-destructive">{error}</div>
          <button onClick={clearError} className="text-destructive hover:text-destructive/80">
            <XCircle className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Commit Message */}
      <div className="border-b px-3 py-2 space-y-2">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="رسالة الـ commit (Ctrl+Enter للدفع)"
          className="w-full resize-none rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          rows={3}
          disabled={isPushing}
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={handlePush}
            disabled={isPushing || stagedChanges.length === 0 || !commitMessage.trim()}
          >
            {isPushing ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                {pushProgress.pct}%
              </>
            ) : (
              <>
                <Upload className="mr-1 h-3 w-3" />
                Commit & Push ({stagedChanges.length})
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handlePull}
            disabled={isPulling}
            title="سحب آخر التغييرات"
          >
            {isPulling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Push Progress */}
        {isPushing && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{pushProgress.msg}</p>
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${pushProgress.pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Last Push Result */}
        {lastPushResult && !isPushing && (
          <div className="flex items-center gap-1 text-xs text-green-500">
            <Check className="h-3 w-3" />
            <span>آخر push: {lastPushResult.sha.slice(0, 7)}</span>
          </div>
        )}
      </div>

      {/* Changes List */}
      <div className="flex-1 overflow-y-auto">
        {/* Staged Changes */}
        {stagedChanges.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50">
              <span className="text-xs font-medium uppercase tracking-wide">
                Staged ({stagedChanges.length})
              </span>
              <button
                onClick={unstageAll}
                className="text-xs text-muted-foreground hover:text-foreground"
                title="Unstage All"
              >
                <Minus className="h-3 w-3" />
              </button>
            </div>
            {stagedChanges.map((change) => (
              <ChangeRow
                key={change.path}
                change={change}
                onAction={() => unstageFile(change.path)}
                actionIcon={<Minus className="h-3 w-3" />}
                actionTitle="Unstage"
              />
            ))}
          </div>
        )}

        {/* Unstaged Changes */}
        {unstagedChanges.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50">
              <span className="text-xs font-medium uppercase tracking-wide">
                Changes ({unstagedChanges.length})
              </span>
              <button
                onClick={stageAll}
                className="text-xs text-muted-foreground hover:text-foreground"
                title="Stage All"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            {unstagedChanges.map((change) => (
              <ChangeRow
                key={change.path}
                change={change}
                onAction={() => stageFile(change.path)}
                actionIcon={<Plus className="h-3 w-3" />}
                actionTitle="Stage"
              />
            ))}
          </div>
        )}

        {/* No Changes */}
        {changes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCheck className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-xs text-muted-foreground">
              لا توجد تغييرات — كل شيء محدّث
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Change Row Component                                               */
/* ------------------------------------------------------------------ */

function ChangeRow({
  change,
  onAction,
  actionIcon,
  actionTitle,
}: {
  change: TrackedChange;
  onAction: () => void;
  actionIcon: React.ReactNode;
  actionTitle: string;
}) {
  const fileName = change.path.split('/').pop() || change.path;
  const dirPath = change.path.split('/').slice(0, -1).join('/');

  return (
    <div className="group flex items-center gap-2 px-3 py-1 hover:bg-accent/50 cursor-pointer">
      <StatusBadge status={change.status} />
      <div className="flex-1 min-w-0">
        <span className="text-xs truncate block">{fileName}</span>
        {dirPath && (
          <span className="text-[10px] text-muted-foreground truncate block">
            {dirPath}
          </span>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAction();
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-opacity"
        title={actionTitle}
      >
        {actionIcon}
      </button>
    </div>
  );
}
