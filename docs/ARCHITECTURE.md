# 🏗️ CodeForge IDE — Agent System Architecture

> التوثيق الكامل لنظام الوكيل الذكي المستقل في CodeForge IDE.
> آخر تحديث: فبراير 2026 — المرحلة 7

---

## 📋 نظرة عامة

نظام الوكيل في CodeForge IDE هو **وكيل ذكاء اصطناعي مستقل بالكامل** — وليس تكاملاً مع GitHub Copilot أو أي خدمة خارجية. يتصل مباشرة بمزوّدي LLM عبر REST API ويدير المستودعات عبر GitHub API.

### المبادئ الأساسية

1. **الاستقلالية** — لا يعتمد على أي خدمة وسيطة
2. **تعدد المزوّدين** — يعمل مع OpenAI, Anthropic, Google, Groq
3. **الأمان أولاً** — كل أداة مصنّفة بمستوى خطر
4. **الشفافية** — كل عملية مسجّلة في سجل التدقيق
5. **المرونة** — Provider Adapter Pattern يسمح بإضافة مزوّدين جدد بسهولة

---

## 🔄 تدفق البيانات

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User Input  │────▶│  Agent Service   │────▶│  LLM Provider   │
│  (Chat UI)   │     │  (Conversation   │     │  (OpenAI /      │
│              │     │   Loop Engine)   │     │   Anthropic /   │
│              │     │                  │     │   Google /      │
│              │     │                  │◀────│   Groq)         │
└─────────────┘     └────────┬─────────┘     └─────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Tool Call?       │
                    │  ┌─YES───────┐   │
                    │  ▼           │   │
                    │  Safety      │   │
                    │  Module      │   │
                    │  ┌───────┐   │   │
                    │  │ AUTO  │───┼───┼──▶ Execute immediately
                    │  │ NOTIFY│───┼───┼──▶ Toast + Execute
                    │  │CONFIRM│───┼───┼──▶ Dialog → Approve/Reject
                    │  └───────┘   │   │
                    │              │   │
                    │  ┌───────────▼─┐ │
                    │  │ Tool        │ │
                    │  │ Executor    │ │
                    │  │ (45 tools)  │ │
                    │  └──────┬──────┘ │
                    │         │        │
                    │  ┌──────▼──────┐ │
                    │  │ Audit       │ │
                    │  │ Logger      │ │
                    │  └─────────────┘ │
                    └──────────────────┘
```

---

## 📂 هيكل الملفات

```
lib/agent/
├── types.ts                    → جميع الأنواع (TypeScript interfaces)
├── constants.ts                → ثوابت (providers, models, limits)
├── agent-service.ts            → المحرك الأساسي (conversation loop)
├── audit-logger.ts             → سجل التدقيق (localStorage + stats + export)
├── README.md                   → توثيق سريع
│
├── providers/
│   ├── index.ts                → تصدير مركزي + getDefaultProvider()
│   ├── openai.ts               → OpenAI adapter (GPT-4o, GPT-4o-mini, o1)
│   ├── anthropic.ts            → Anthropic adapter (Claude 3.5/3 Opus/Haiku)
│   ├── google.ts               → Google adapter (Gemini 2.0/1.5 Pro/Flash)
│   └── groq.ts                 → Groq adapter (Llama 3.3, Mixtral, Gemma2)
│
├── tools/
│   ├── index.ts                → تصدير مركزي (ALL_TOOLS: 45 أداة)
│   ├── github-tools.ts         → 25 أداة GitHub API
│   ├── filesystem-tools.ts     → 9 أدوات نظام ملفات محلي
│   ├── git-tools.ts            → 8 أدوات Git
│   └── utility-tools.ts        → 3 أدوات مساعدة
│
├── safety/
│   ├── index.ts                → processToolSafety() — نقطة الدخول الوحيدة
│   ├── risk-classifier.ts      → تصنيف المخاطر + كشف الملفات الحساسة
│   └── approval-manager.ts     → إنشاء الموافقات والإشعارات
│
├── bridge/
│   └── tool-bridge.ts          → ربط الأدوات بالأنظمة الفعلية (GitHub API, FS, Git)
│
├── hooks/
│   ├── use-agent-chat.ts       → React hook للمحادثة مع الوكيل
│   └── use-audit-log.ts        → React hook لسجل التدقيق
│
└── __tests__/
    └── integration.test.ts     → 13 اختبار تكامل
```

---

## 🔧 الوحدات بالتفصيل

### 1. types.ts — النظام النوعي

| النوع | الوصف |
|---|---|
| `ProviderId` | `'openai' \| 'google' \| 'groq' \| 'anthropic'` |
| `RiskLevel` | `'auto' \| 'notify' \| 'confirm'` |
| `ApprovalSource` | `'auto' \| 'notify' \| 'user'` |
| `AgentConfig` | إعدادات الوكيل (provider, apiKey, model, temperature...) |
| `ToolDefinition` | تعريف أداة (name, parameters, riskLevel, category) |
| `ToolCall` | استدعاء أداة من LLM (id, name, arguments) |
| `ToolCallResult` | نتيجة (success, data, error, diff) |
| `PendingApproval` | طلب موافقة (toolCall, description, affectedFiles, status) |
| `AuditLogEntry` | سجل عملية (toolName, args, result, riskLevel, approvedBy, timestamp) |

### 2. agent-service.ts — المحرك

الوظيفة الأساسية هي `sendMessage()` التي تدير حلقة المحادثة:

```
User message → Build system prompt → Call LLM provider
     ↓
LLM responds with tool_calls?
     ├── NO  → Return text response
     └── YES → For each tool call:
              ├── Anti-loop check (max 3 same calls)
              ├── processToolSafety() → SafetyAction
              ├── If CONFIRM → await onApprovalRequired()
              ├── If NOTIFY  → onNotify() (non-blocking)
              ├── Execute tool
              ├── Log to audit
              └── Feed result back to LLM → loop
```

### 3. safety/ — نظام الأمان

**Entry point واحد:** `processToolSafety(toolCall, toolDef) → SafetyAction`

```typescript
type SafetyAction =
  | { type: 'auto';    riskLevel: 'auto' }
  | { type: 'notify';  riskLevel: 'notify';  notification: ToolNotification }
  | { type: 'confirm'; riskLevel: 'confirm'; approval: PendingApproval }
```

**Risk Escalation:** الـ classifier يمكن أن يرفع مستوى الخطر:
- ملف `.env` أو يحتوي `_secret` → يُرفع إلى CONFIRM
- محتوى يحتوي `password` أو `api_key` → تحذير

### 4. audit-logger.ts — سجل التدقيق

- **التخزين:** localStorage (500 entry max, 30-day auto-cleanup)
- **logStart()** → يُرجع `{ finish(), reject() }` لتسجيل المدة
- **filter()** — بحث بـ toolName, category, riskLevel, dateRange, searchQuery
- **getStats()** — إحصائيات شاملة (نجاح/فشل/رفض، حسب الأداة، المدة المتوسطة)
- **exportJSON() / exportCSV()** — تصدير كامل

---

## 🔧 مصفوفة الأدوات الكاملة (45 أداة)

### 🟢 AUTO — القراءة فقط (15 أداة)

| # | الأداة | الفئة | الوصف |
|---|---|---|---|
| 1 | `github_read_file` | github | قراءة ملف من المستودع |
| 2 | `github_list_files` | github | عرض محتويات مجلد |
| 3 | `github_search_code` | github | بحث في الكود |
| 4 | `github_list_branches` | github | عرض الفروع |
| 5 | `github_get_commit_history` | github | سجل الحفظ |
| 6 | `github_get_pull_request` | github | تفاصيل PR |
| 7 | `github_list_pull_requests` | github | عرض PRs |
| 8 | `github_list_issues` | github | عرض Issues |
| 9 | `github_get_repo_info` | github | معلومات المستودع |
| 10 | `github_list_repos` | github | عرض المستودعات |
| 11 | `github_search_repos` | github | بحث في المستودعات |
| 12 | `github_get_user_info` | github | معلومات المستخدم |
| 13 | `fs_list_files` | filesystem | عرض ملفات محلية |
| 14 | `fs_read_file` | filesystem | قراءة ملف محلي |
| 15 | `fs_search_files` | filesystem | بحث في الملفات المحلية |

> + أدوات Utility الثلاث: `get_project_context`, `explain_code`, `suggest_fix`
> + أدوات Git القراءة: `git_status`, `git_diff`, `git_log`

### 🟡 NOTIFY — كتابة وتعديل (17 أداة)

| # | الأداة | الفئة | الوصف |
|---|---|---|---|
| 1 | `github_push_file` | github | إنشاء/تحديث ملف |
| 2 | `github_edit_file` | github | تعديل جراحي (old_str→new_str) |
| 3 | `github_create_branch` | github | إنشاء فرع |
| 4 | `github_create_pull_request` | github | إنشاء PR |
| 5 | `github_create_issue` | github | إنشاء Issue |
| 6 | `github_update_issue` | github | تحديث Issue |
| 7 | `github_add_comment` | github | إضافة تعليق |
| 8 | `fs_create_file` | filesystem | إنشاء ملف محلي |
| 9 | `fs_update_file` | filesystem | تحديث ملف محلي |
| 10 | `fs_create_folder` | filesystem | إنشاء مجلد |
| 11 | `fs_rename_file` | filesystem | إعادة تسمية |
| 12 | `fs_move_file` | filesystem | نقل ملف |
| 13 | `git_stage` | git | تجهيز ملفات |
| 14 | `git_commit` | git | حفظ التغييرات |
| 15 | `git_create_branch` | git | إنشاء فرع محلي |

### 🔴 CONFIRM — عمليات خطرة (13 أداة)

| # | الأداة | الفئة | الوصف |
|---|---|---|---|
| 1 | `github_delete_file` | github | حذف ملف |
| 2 | `github_push_files` | github | دفع ملفات متعددة (atomic) |
| 3 | `github_merge_pull_request` | github | دمج PR |
| 4 | `github_delete_branch` | github | حذف فرع |
| 5 | `github_create_repo` | github | إنشاء مستودع |
| 6 | `github_delete_repo` | github | حذف مستودع (لا رجعة!) |
| 7 | `fs_delete_file` | filesystem | حذف ملف محلي |
| 8 | `git_push` | git | دفع للـ remote |
| 9 | `git_create_pr` | git | إنشاء PR من محلي |

---

## 🔌 Provider Adapter Pattern

كل مزوّد يتبع نفس الواجهة الداخلية:

```typescript
async function callProvider(
  config: AgentConfig,
  messages: Array<{ role: string; content: string }>,
  tools: ToolDefinition[]
): Promise<{ content?: string; toolCalls?: ToolCall[] }>
```

الاختلاف فقط في:
- **Wire format** — كيف تُرسل الأدوات (functions vs tools vs functionDeclarations)
- **Headers** — Authorization vs x-api-key vs query param
- **Response parsing** — tool_calls vs content[type=tool_use] vs functionCall parts

| المزوّد | الموديلات | الميزة |
|---|---|---|
| **OpenAI** | GPT-4o, GPT-4o-mini, o1-preview, o1-mini | أقوى tool calling |
| **Anthropic** | Claude 3.5 Sonnet/Haiku, Claude 3 Opus | أفضل reasoning |
| **Google** | Gemini 2.0 Flash, 1.5 Pro/Flash | أكبر context window |
| **Groq** | Llama 3.3 70B, Mixtral 8x7B, Gemma2 9B | الأسرع (مجاني!) |

---

## 🧪 الاختبارات

ملف: `lib/agent/__tests__/integration.test.ts`

| المجموعة | الاختبارات | التغطية |
|---|---|---|
| Type Compatibility | 3 | ApprovalSource values, AuditLogEntry.approvedBy, RiskLevel |
| Safety Classification | 4 | AUTO→auto, NOTIFY→notify+notification, CONFIRM→confirm+approval, unknown fallback |
| Audit Logger | 6 | log(), logStart+finish, reject, notify approvedBy, filter, stats, exportCSV, inferCategory |
| Safety→Audit Integration | 2 | CONFIRM→reject→audit, NOTIFY→execute→audit |

---

## 🔮 التطوير المستقبلي

| الميزة | الأولوية | الوصف |
|---|---|---|
| Streaming (SSE) | عالية | استجابات تدفقية بدل انتظار الرد الكامل |
| Agent Memory | عالية | حفظ السياق عبر الجلسات |
| Custom Tools API | متوسطة | إضافة أدوات مخصصة عبر plugin system |
| Multi-Agent | منخفضة | عدة وكلاء متخصصين يتعاونون |
| Fine-tuned Models | منخفضة | نماذج مخصصة لعمليات الكود |

---

<div align="center">

📖 [العودة لـ README](../README.md) • 📋 [سجل التغييرات](../CHANGELOG.md)

</div>
