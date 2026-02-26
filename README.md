# 🔨 CodeForge IDE

<div align="center">

![CodeForge IDE](https://img.shields.io/badge/CodeForge-IDE-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![AI Agent](https://img.shields.io/badge/AI_Agent-Standalone-green?style=for-the-badge&logo=openai&logoColor=white)

**محرر أكواد متكامل في المتصفح مع وكيل ذكاء اصطناعي مستقل ودعم كامل لـ Git و GitHub**

[Live Demo](#) • [Architecture](./docs/ARCHITECTURE.md) • [Changelog](./CHANGELOG.md) • [Report Bug](https://github.com/bahoma31-jpg/codeforge-ide/issues)

</div>

---

## 🌟 الميزات الرئيسية

### 🤖 وكيل الذكاء الاصطناعي المستقل (جديد!)

وكيل ذكي مستقل بالكامل — ليس تكاملاً مع GitHub Copilot — بل نظام مبني من الصفر يتصل مباشرة بأي مزوّد LLM ويدير المستودع عبر GitHub REST API.

- 🧠 **Multi-Provider** — يدعم OpenAI، Anthropic (Claude)، Google Gemini، و Groq
- 🔧 **45 أداة ذكية** — عمليات GitHub API (25) + نظام ملفات محلي (9) + Git (8) + أدوات مساعدة (3)
- 🛡️ **نظام أمان ثلاثي الطبقات**:
  - 🟢 **AUTO** — القراءة فقط، ينفّذ تلقائياً بلا تدخل
  - 🟡 **NOTIFY** — الكتابة والتعديل، ينفّذ مع إشعار Toast
  - 🔴 **CONFIRM** — الحذف والعمليات الخطرة، يحتاج موافقة صريحة
- 📊 **سجل تدقيق متقدم** — تسجيل كل عملية مع مدة التنفيذ، التصنيف، الإحصائيات، والتصدير (JSON/CSV)
- 🔄 **وضعان تشغيل** — PLAN MODE للمهام المعقدة، ACT MODE للتنفيذ المباشر
- 🛑 **حماية من التكرار** — يوقف الحلقات اللانهائية تلقائياً بعد 3 محاولات
- 🌐 **System Prompt ديناميكي** — يحقن متغيرات المشروع (repo, branch, model) تلقائياً

### ✏️ محرر الأكواد المتقدم

- ✨ **Monaco Editor** — نفس محرر VS Code مع دعم كامل للغات البرمجة
- 🎨 **Syntax Highlighting** — تلوين تلقائي لأكثر من 60 لغة برمجة
- 💡 **IntelliSense** — إكمال تلقائي ذكي واقتراحات
- 🔍 **Find & Replace** — بحث واستبدال قوي مع Regex
- 📝 **Multi-cursor Editing** — تعديل متعدد النقاط
- 🎯 **Code Formatting** — تنسيق تلقائي للكود

### 🔗 تكامل Git و GitHub

- 🔐 **GitHub OAuth** — مصادقة آمنة مع GitHub
- 📦 **Repository Management** — إدارة كاملة للمستودعات
- 🌿 **Branch Operations** — إنشاء، تبديل، ودمج الفروع
- 💾 **Local Git** — عمليات Git محلية (commit, push, pull, merge)
- 🔄 **Sync Status** — مزامنة فورية مع GitHub
- 🔀 **Conflict Resolution** — حل التعارضات بصريًا

### 📁 نظام الملفات المتقدم

- 💿 **IndexedDB Storage** — تخزين محلي قوي وسريع
- 📂 **File Explorer** — مستكشف ملفات تفاعلي
- 📄 **Multi-file Tabs** — فتح ملفات متعددة في نفس الوقت
- 🗂️ **Folder Structure** — دعم كامل للمجلدات والملفات

### 💻 محطة طرفية متكاملة

- 💻 **xterm.js Terminal** — محطة طرفية حقيقية في المتصفح
- 🖥️ **Multiple Terminals** — فتح محطات متعددة
- ⚡ **Built-in Commands** — أوامر مدمجة (ls, cd, mkdir, cat...)
- 🔧 **Git Commands** — أوامر Git كاملة

---

## 🚀 البدء السريع

### المتطلبات المسبقة

- **Node.js** ≥ 18.x ([تحميل](https://nodejs.org/))
- **pnpm** ≥ 9.x ([تحميل](https://pnpm.io/installation)) — يمكن تفعيله عبر: `corepack enable pnpm`

### التثبيت

```bash
# 1. استنساخ المستودع
git clone https://github.com/bahoma31-jpg/codeforge-ide.git
cd codeforge-ide

# 2. تثبيت المكتبات
pnpm install

# 3. تشغيل في وضع التطوير
pnpm dev
```

سيعمل التطبيق على `http://localhost:3000`

### إعداد وكيل الذكاء الاصطناعي

1. افتح **الإعدادات** (⚙️) في الشريط الجانبي
2. اختر **مزوّد LLM** (OpenAI / Anthropic / Google / Groq)
3. أدخل **مفتاح API** الخاص بالمزوّد
4. أدخل **GitHub Personal Access Token** (لعمليات المستودع)
5. اختر النموذج المناسب وابدأ المحادثة!

### البناء للإنتاج

```bash
pnpm build
pnpm start
```

---

## 🏗️ البنية المعمارية

```
CodeForge IDE
├── 🤖 AI Agent Layer (lib/agent/)
│   ├── agent-service.ts      → المحرك الأساسي (conversation loop + tool execution)
│   ├── types.ts               → جميع الأنواع TypeScript
│   ├── constants.ts           → ثوابت (providers, models, limits)
│   ├── audit-logger.ts        → سجل تدقيق مع localStorage
│   ├── providers/             → مهايئات المزوّدين (OpenAI, Anthropic, Google, Groq)
│   ├── tools/                 → 45 أداة (github/, filesystem/, git/, utility/)
│   ├── safety/                → نظام الأمان الثلاثي (risk-classifier + approval-manager)
│   ├── bridge/                → ربط الأدوات بالأنظمة الفعلية
│   ├── hooks/                 → React hooks (useAgentChat, useAuditLog)
│   └── __tests__/             → اختبارات التكامل (13 حالة)
│
├── 🎨 Frontend (Next.js + React)
│   ├── Monaco Editor          → تحرير الأكواد
│   ├── xterm.js               → المحطة الطرفية
│   ├── Agent Panel            → واجهة المحادثة مع الوكيل
│   ├── Approval Dialog        → حوار الموافقة على العمليات الخطرة
│   ├── Notify Toast           → إشعارات العمليات المتوسطة
│   └── Tool Call Status       → عرض حالة 45 أداة مع أيقونات
│
├── 💾 State Management (Zustand)
│   ├── Editor Store
│   ├── Git Store
│   ├── File System Store
│   └── Terminal Store
│
├── 🔧 Core Services
│   ├── Git Service (isomorphic-git)
│   ├── File System Service (IndexedDB)
│   ├── GitHub API Service
│   └── Terminal Service
│
└── 🗄️ Storage Layer
    ├── IndexedDB (Files)
    ├── LocalStorage (Settings + Audit Log)
    └── Session Storage (Auth Tokens)
```

### Technology Stack

| الفئة | التقنية |
|---|---|
| **Frontend** | Next.js 14.2, React 18, TypeScript |
| **Editor** | Monaco Editor |
| **Terminal** | xterm.js |
| **UI Library** | shadcn/ui, Tailwind CSS, Framer Motion |
| **State** | Zustand |
| **Git** | isomorphic-git |
| **Storage** | IndexedDB, LightningFS, localStorage |
| **Auth** | NextAuth.js (GitHub OAuth) |
| **AI Agent** | Custom engine, Multi-provider (4 LLMs) |
| **AI Tools** | 45 tools, Triple-layer safety |
| **Testing** | Jest / Vitest, 13 integration tests |
| **Package Manager** | pnpm |

---

## 🛡️ نظام الأمان الثلاثي

كل أداة من الـ 45 مصنّفة في أحد ثلاث مستويات:

| المستوى | الأدوات | السلوك | مثال |
|---|---|---|---|
| 🟢 **AUTO** | 15 أداة | ينفّذ فوراً بلا تدخل | `github_read_file`, `git_status`, `fs_list_files` |
| 🟡 **NOTIFY** | 17 أداة | ينفّذ + يظهر Toast إشعاري | `github_push_file`, `github_edit_file`, `git_commit` |
| 🔴 **CONFIRM** | 13 أداة | يوقف وينتظر موافقة صريحة | `github_delete_file`, `github_merge_pull_request`, `git_push` |

راجع [ARCHITECTURE.md](./docs/ARCHITECTURE.md) للقائمة الكاملة.

---

## 🧪 الاختبارات

```bash
# تشغيل اختبارات التكامل
npx vitest run lib/agent/__tests__/integration.test.ts

# تشغيل جميع الاختبارات
pnpm test

# مع التغطية
pnpm test:coverage
```

### حالات الاختبار (13 اختبار)

| المجموعة | العدد | يختبر |
|---|---|---|
| Type Compatibility | 3 | توافق `ApprovalSource` و `RiskLevel` عبر الوحدات |
| Safety Classification | 4 | تصنيف AUTO/NOTIFY/CONFIRM + fallback |
| Audit Logger | 6 | log, logStart, reject, filter, stats, CSV export |
| Safety→Audit Integration | 2 | التدفق الكامل: safety → execute → audit |

---

## 📖 التوثيق

- 🏗️ [**البنية المعمارية**](./docs/ARCHITECTURE.md) — توثيق كامل لنظام الوكيل
- 📋 [**سجل التغييرات**](./CHANGELOG.md) — كل التحديثات مرحلة بمرحلة
- 🔗 [**دليل تكامل Git**](./docs/git-integration.md) — كيفية استخدام Git و GitHub
- 💻 [**أوامر المحطة الطرفية**](./docs/terminal-commands.md) — قائمة الأوامر المدعومة
- ⌨️ [**اختصارات لوحة المفاتيح**](./docs/keyboard-shortcuts.md) — الاختصارات المتاحة

---

## 🤝 المساهمة

نرحب بجميع المساهمات! راجع [دليل المساهمة](./CONTRIBUTING.md).

```bash
# 1. Fork المشروع
# 2. أنشئ فرعاً: git checkout -b feature/MyFeature
# 3. احفظ: git commit -m 'feat: add MyFeature'
# 4. ادفع: git push origin feature/MyFeature
# 5. افتح Pull Request
```

nستخدم [Conventional Commits](https://www.conventionalcommits.org/):
`feat:` | `fix:` | `docs:` | `refactor:` | `test:` | `chore:`

---

## 📝 خارطة الطريق

### Version 1.0 ✅ (الحالي)

- [x] Monaco Editor + Terminal + File System
- [x] GitHub OAuth + Git Operations
- [x] **وكيل ذكاء اصطناعي مستقل (Multi-Provider)**
- [x] **45 أداة ذكية (4 فئات)**
- [x] **نظام أمان ثلاثي الطبقات**
- [x] **سجل تدقيق مع تصدير**
- [x] **13 اختبار تكامل**
- [x] PWA Support + CI/CD

### Version 1.1 (التالي)

- [ ] Streaming responses (SSE)
- [ ] Extensions / Plugins system
- [ ] Agent memory (cross-session context)
- [ ] Voice commands
- [ ] Collaborative editing

### Version 2.0 (المستقبل)

- [ ] Multi-agent orchestration
- [ ] Live Share
- [ ] Debugging Tools
- [ ] Container Support
- [ ] Mobile app

---

## 📄 الرخصة

مرخص بموجب **MIT License** — راجع [LICENSE](./LICENSE) للتفاصيل.

---

<div align="center">

**تم التطوير بواسطة [bahoma31-jpg](https://github.com/bahoma31-jpg)**

[![GitHub](https://img.shields.io/github/followers/bahoma31-jpg?label=Follow&style=social)](https://github.com/bahoma31-jpg)

**⭐ إذا أعجبك المشروع، لا تنسى إضافة نجمة! ⭐**

Made with ❤️ by developers, for developers

</div>
