# 📋 Changelog — CodeForge IDE Agent System

جميع التغييرات على نظام الوكيل الذكي المستقل موثّقة هنا.
التنسيق مبني على [Keep a Changelog](https://keepachangelog.com/ar/1.1.0/).

---

## [1.0.0] — 2026-02-26

### 🎯 الملخص

إطلاق نظام الوكيل الذكي المستقل بالكامل — من الصفر إلى 45 أداة مع نظام أمان ثلاثي وسجل تدقيق وواجهة متكاملة.

---

### المرحلة 1 — البنية الأساسية

#### أُضيف

- `lib/agent/types.ts` — جميع الأنواع TypeScript (20+ interfaces)
- `lib/agent/constants.ts` — ثوابت المزوّدين والموديلات والحدود
- `lib/agent/providers/index.ts` — تصدير مركزي للمزوّدين
- `lib/agent/providers/openai.ts` — OpenAI adapter (GPT-4o, GPT-4o-mini, o1)
- `lib/agent/providers/anthropic.ts` — Anthropic adapter (Claude 3.5/3)
- `lib/agent/providers/google.ts` — Google Gemini adapter (2.0 Flash, 1.5 Pro)
- `lib/agent/providers/groq.ts` — Groq adapter (Llama 3.3, Mixtral, Gemma2)

#### أُزيل

- مجلد `.agent/` القديم بالكامل (كان يعتمد على GitHub Copilot)

---

### المرحلة 2 — نظام الأدوات (45 أداة)

#### أُضيف

- `lib/agent/tools/index.ts` — تصدير مركزي (`ALL_TOOLS`, `getToolsByCategory()`)
- `lib/agent/tools/github-tools.ts` — 25 أداة GitHub API:
  - 🟢 AUTO: read_file, list_files, search_code, list_branches, get_commit_history, get_pull_request, list_pull_requests, list_issues, get_repo_info, list_repos, search_repos, get_user_info
  - 🟡 NOTIFY: push_file, edit_file, create_branch, create_pull_request, create_issue, update_issue, add_comment
  - 🔴 CONFIRM: delete_file, push_files, merge_pull_request, delete_branch, create_repo, delete_repo
- `lib/agent/tools/filesystem-tools.ts` — 9 أدوات نظام ملفات محلي
- `lib/agent/tools/git-tools.ts` — 8 أدوات Git
- `lib/agent/tools/utility-tools.ts` — 3 أدوات مساعدة (get_project_context, explain_code, suggest_fix)

---

### المرحلة 3 — نظام الأمان الثلاثي

#### أُضيف

- `lib/agent/safety/index.ts` — `processToolSafety()` entry point + SafetyAction type
- `lib/agent/safety/risk-classifier.ts` — تصنيف المخاطر:
  - `classifyRisk()` — تصنيف أداة حسب الاسم
  - `classifyGitHubRisk()` — تصنيف GitHub-specific
  - `isSensitiveFile()` — كشف ملفات حساسة (.env, secrets)
  - `containsRiskyContent()` — كشف محتوى خطر (passwords, tokens)
- `lib/agent/safety/approval-manager.ts` — إدارة الموافقات:
  - `getEffectiveRisk()` — المستوى الفعلي (مع risk escalation)
  - `createApproval()` — إنشاء PendingApproval
  - `createNotification()` — إنشاء ToolNotification

---

### المرحلة 4 — محرك الوكيل

#### أُضيف

- `lib/agent/agent-service.ts` v2.2 — المحرك الأساسي:
  - `SYSTEM_PROMPT_TEMPLATE` — system prompt ديناميكي (9 أقسام)
  - `buildSystemPrompt()` — حقن متغيرات runtime
  - `AgentService` class:
    - `sendMessage()` — حلقة المحادثة مع tool calling
    - `registerToolExecutor()` — تسجيل منفّذي الأدوات
    - Triple-layer safety integration
    - Anti-loop protection (3 max same calls)
    - `onNotify` callback (backward compatible)
  - `callProvider()` — 4 adapters (OpenAI, Groq, Gemini, Anthropic)
- `lib/agent/audit-logger.ts` — سجل تدقيق متقدم:
  - `log()`, `logStart()` → `finish()`/`reject()`
  - `filter()`, `getRecent()`, `getStats()`
  - `exportJSON()`, `exportCSV()`, `downloadExport()`
  - Auto-cleanup (30 days), max 500 entries
  - `subscribe()` for reactive updates
- `lib/agent/bridge/tool-bridge.ts` — ربط الأدوات بالأنظمة الفعلية
- `lib/agent/hooks/use-agent-chat.ts` — React hook للمحادثة
- `lib/agent/hooks/use-audit-log.ts` — React hook لسجل التدقيق

---

### المرحلة 5 — ربط الواجهة بنظام الأمان

#### أُضيف

- `components/agent/notify-toast.tsx` — إشعار Toast لعمليات NOTIFY:
  - Auto-dismiss بعد 4 ثوانٍ
  - شريط تقدم متحرك
  - أيقونة حسب فئة الأداة
  - عرض الملفات المتأثرة
- `components/agent/tool-call-status.tsx` — حالة الأدوات:
  - أيقونة فريدة لكل من الـ 45 أداة
  - Badge لمستوى الخطر (🟢/🟡/🔴)
  - حالات: pending → executing → completed/failed

#### عُدّل

- `components/agent/agent-panel.tsx` — أُضيف:
  - `onNotify` prop passing
  - Audit log panel integration
  - Tool status display per message
- `components/agent/approval-dialog.tsx` — تحسينات:
  - عرض الملفات المتأثرة
  - Diff preview
  - مؤقت 30 ثانية auto-reject

---

### المرحلة 6 — اختبار التكامل + إصلاح التوافق

#### أُضيف

- `lib/agent/__tests__/integration.test.ts` — 13 اختبار تكامل:
  - Type Compatibility (3 tests)
  - Safety Classification (4 tests)
  - Audit Logger (6 tests)
  - Safety→Audit Integration (2 tests)

#### أُصلح

- `lib/agent/types.ts` — **Breaking:** أُضيف نوع `ApprovalSource = 'auto' | 'notify' | 'user'`
  - `AuditLogEntry.approvedBy` كان `'auto' | 'user'` → أصبح `ApprovalSource`
  - هذا يُوافق ما يُرسله `agent-service.ts` فعلاً
- `lib/agent/audit-logger.ts` v2.1:
  - `AuditLogEntryEnhanced.approvedBy` → يستخدم `ApprovalSource`
  - `logStart().finish()` → parameter يقبل `ApprovalSource`
  - `inferCategory()` → يتعرف على `fs_*` prefix
  - `generateSummary()` → يغطي جميع الـ 45 أداة (كان 20 فقط)
  - `exportCSV()` → أُضيف عمود "Approved By"

---

### المرحلة 7 — التوثيق النهائي

#### أُضيف

- `docs/ARCHITECTURE.md` — توثيق البنية المعمارية الكامل:
  - Data flow diagram
  - Module dependency map
  - Full tool matrix (45 tools × 3 levels)
  - Provider adapter pattern
  - File-by-file documentation
- `CHANGELOG.md` — سجل التغييرات الكامل (هذا الملف)

#### عُدّل

- `README.md` v2.0 — أُعيد كتابته بالكامل:
  - AI Agent كميزة رئيسية
  - Architecture diagram يشمل Agent Layer
  - Tech Stack table مُحدّث
  - Roadmap مُحدّث (v1.0 AI Agent ✅)
  - Agent Quick Start section
  - Safety System summary table

---

## إحصائيات الإصدار

| المقياس           | القيمة                              |
| ----------------- | ----------------------------------- |
| الملفات المُنشأة  | ~25 ملف                             |
| الملفات المُعدّلة | ~10 ملفات                           |
| إجمالي الأدوات    | 45 أداة                             |
| المزوّدون         | 4 (OpenAI, Anthropic, Google, Groq) |
| مستويات الأمان    | 3 (AUTO, NOTIFY, CONFIRM)           |
| اختبارات التكامل  | 13 حالة                             |
| مراحل التنفيذ     | 7 مراحل                             |

---

<div align="center">

📖 [README](./README.md) • 🏗️ [Architecture](./docs/ARCHITECTURE.md)

</div>
