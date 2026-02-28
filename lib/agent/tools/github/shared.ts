/**
 * CodeForge IDE — GitHub API Shared Helpers
 *
 * دوال مساعدة مشتركة لجميع أدوات GitHub:
 * - getGitHubToken: جلب التوكن من الإعدادات
 * - getAuthenticatedUsername: جلب اسم المستخدم (مع cache)
 * - githubFetch / githubFetchRaw: استدعاءات API
 * - GitHubApiError: خطأ مخصص لـ GitHub API
 * - TOOL_LIMITATIONS: قيود الأدوات المعروفة
 */

import { logger } from '@/lib/monitoring/error-logger';

const GITHUB_API = 'https://api.github.com';

// ═══════════════════════════════════════════════════════════════════════════
// KNOWN LIMITATIONS — Operations that require special token scopes
// ═══════════════════════════════════════════════════════════════════════════

export const TOOL_LIMITATIONS: Record<
  string,
  {
    requiredScope: string;
    userMessage: string;
    fallbackInstructions: string;
  }
> = {
  github_delete_repo: {
    requiredScope: 'delete_repo',
    userMessage:
      '⚠️ حذف المستودعات يتطلب صلاحية خاصة (delete_repo) في GitHub Token.\n' +
      'هذه الصلاحية غير مفعّلة افتراضياً لأسباب أمنية.',
    fallbackInstructions:
      '**لحذف المستودع يدوياً:**\n' +
      '1. افتح المستودع على GitHub\n' +
      '2. اذهب إلى **Settings** → **Danger Zone**\n' +
      '3. اضغط **Delete this repository**\n\n' +
      '**أو عبر CLI:**\n' +
      '```bash\n' +
      'gh auth refresh -s delete_repo\n' +
      'gh api -X DELETE repos/{owner}/{repo}\n' +
      '```',
  },
};

// ─── Helper: Get GitHub Token ─────────────────────────────────

export async function getGitHubToken(): Promise<string> {
  try {
    const configRaw = localStorage.getItem('codeforge-agent-config');
    if (configRaw) {
      const config = JSON.parse(configRaw);
      if (config.githubToken) return config.githubToken;
    }
  } catch {
    logger.warn('فشل قراءة التوكن من localStorage', {
      source: 'github-shared.getGitHubToken',
    });
  }

  try {
    const { useAuthStore } = await import('@/lib/stores/auth-store');
    const token = useAuthStore.getState().token;
    if (token) return token;
  } catch {
    logger.warn('فشل قراءة التوكن من auth-store', {
      source: 'github-shared.getGitHubToken',
    });
  }

  throw new Error(
    'لم يتم العثور على GitHub Token. يرجى إدخاله في إعدادات الوكيل.'
  );
}

// ─── Helper: Get authenticated username (cached) ─────────────

let _cachedUsername: string | null = null;

export async function getAuthenticatedUsername(): Promise<string | null> {
  if (_cachedUsername) return _cachedUsername;

  try {
    const token = await getGitHubToken();
    const response = await fetch(`${GITHUB_API}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (response.ok) {
      const data = await response.json();
      _cachedUsername = data.login as string;
      return _cachedUsername;
    }
  } catch {
    logger.warn('فشل جلب اسم المستخدم من GitHub', {
      source: 'github-shared.getAuthenticatedUsername',
    });
  }
  return null;
}

// ─── GitHubApiError ───────────────────────────────────────────

export class GitHubApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly endpoint: string
  ) {
    super(`GitHub API Error (${status}): ${message}`);
    this.name = 'GitHubApiError';
  }

  isPermissionError(): boolean {
    return this.status === 403 || this.status === 401;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }
}

// ─── Helper: GitHub API Call ──────────────────────────────────

export async function githubFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Record<string, unknown>> {
  const token = await getGitHubToken();

  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      (error as { message?: string }).message || `HTTP ${response.status}`;
    throw new GitHubApiError(response.status, message, endpoint);
  }

  if (response.status === 204) return { success: true };

  return response.json();
}

export async function githubFetchRaw(endpoint: string): Promise<string> {
  const token = await getGitHubToken();

  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API Error (${response.status}): ${response.statusText}`
    );
  }

  return response.text();
}
