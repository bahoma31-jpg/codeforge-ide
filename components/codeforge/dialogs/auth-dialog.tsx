/**
 * CodeForge IDE — GitHub Auth Dialog
 * Professional sign-in modal using Personal Access Token.
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
import {
  Github,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  LogOut,
} from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const {
    signIn,
    signOut,
    isLoading,
    isAuthenticated,
    user,
    error,
    clearError,
  } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const handleSignIn = async () => {
    if (!token.trim()) return;
    clearError();

    try {
      await signIn(token.trim());
      addNotification({
        type: 'success',
        title: 'تم تسجيل الدخول',
        message: `مرحباً ${useAuthStore.getState().user?.name || useAuthStore.getState().user?.login}!`,
        autoDismiss: true,
      });
      setToken('');
      onOpenChange(false);
    } catch {
      // Error is handled by auth store
    }
  };

  const handleSignOut = () => {
    signOut();
    addNotification({
      type: 'info',
      title: 'تم تسجيل الخروج',
      message: 'تم حذف التوكن من المتصفح.',
      autoDismiss: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            {isAuthenticated ? 'GitHub Account' : 'Sign in to GitHub'}
          </DialogTitle>
          <DialogDescription>
            {isAuthenticated
              ? 'حسابك متصل بنجاح.'
              : 'أدخل Personal Access Token من GitHub للوصول إلى المستودعات.'}
          </DialogDescription>
        </DialogHeader>

        {isAuthenticated && user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user.name || user.login}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  @{user.login}
                </p>
              </div>
            </div>
            {user.bio && (
              <p className="text-sm text-muted-foreground">{user.bio}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {user.public_repos} public repos
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(user.html_url, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Profile
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="gh-token" className="text-sm font-medium">
                Personal Access Token
              </label>
              <div className="relative">
                <input
                  id="gh-token"
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handleSignIn}
              disabled={!token.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التحقق…
                </>
              ) : (
                <>
                  <Github className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>

            <div className="rounded-lg bg-muted p-3 space-y-1">
              <p className="text-xs font-medium">كيف تحصل على Token؟</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Settings → Developer settings → Personal access tokens</li>
                <li>اختر &quot;Fine-grained&quot; أو &quot;Classic&quot;</li>
                <li>
                  فعّل صلاحيات:{' '}
                  <code className="bg-background px-1 rounded">repo</code>
                </li>
              </ol>
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                إنشاء Token جديد
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
