# 🔨 CodeForge IDE

<div align="center">

![CodeForge IDE](https://img.shields.io/badge/CodeForge-IDE-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)

**محرر أكواد متكامل في المتصفح مع دعم كامل لـ Git و GitHub**

[Live Demo](#) • [Documentation](./docs) • [Report Bug](https://github.com/bahoma31-jpg/codeforge-ide/issues) • [Request Feature](https://github.com/bahoma31-jpg/codeforge-ide/issues)

</div>

---

## 🌟 Features

### محرر الأكواد المتقدم
- ✨ **Monaco Editor** - نفس محرر VS Code مع دعم كامل للغات البرمجة
- 🎨 **Syntax Highlighting** - تلوين تلقائي لأكثر من 60 لغة برمجة
- 💡 **IntelliSense** - إكمال تلقائي ذكي واقتراحات
- 🔍 **Find & Replace** - بحث واستبدال قوي مع Regex
- 📝 **Multi-cursor Editing** - تعديل متعدد النقاط
- 🎯 **Code Formatting** - تنسيق تلقائي للكود

### تكامل Git و GitHub
- 🔐 **GitHub OAuth** - مصادقة آمنة مع GitHub
- 📦 **Repository Management** - إدارة كاملة للمستودعات
- 🌿 **Branch Operations** - إنشاء، تبديل، ودمج الفروع
- 💾 **Local Git** - عمليات Git محلية (commit, push, pull, merge)
- 🔄 **Sync Status** - مزامنة فورية مع GitHub
- 🔀 **Conflict Resolution** - حل التعارضات بصريًا

### نظام الملفات المتقدم
- 💿 **IndexedDB Storage** - تخزين محلي قوي وسريع
- 📂 **File Explorer** - مستكشف ملفات تفاعلي
- 📄 **Multi-file Tabs** - فتح ملفات متعددة في نفس الوقت
- 🗂️ **Folder Structure** - دعم كامل للمجلدات والملفات
- 📋 **Copy/Paste/Rename** - عمليات الملفات الأساسية

### محطة طرفية متكاملة
- 💻 **xterm.js Terminal** - محطة طرفية حقيقية في المتصفح
- 🖥️ **Multiple Terminals** - فتح محطات متعددة
- ⚡ **Built-in Commands** - أوامر مدمجة (ls, cd, mkdir, cat...)
- 🔧 **Git Commands** - أوامر Git كاملة
- 📊 **Command History** - سجل الأوامر المستخدمة

### تخصيص واجهة المستخدم
- 🎨 **Themes** - ثيمات قابلة للتخصيص (Light/Dark)
- 🔤 **Font Customization** - تخصيص الخطوط والأحجام
- ⌨️ **Keyboard Shortcuts** - اختصارات لوحة مفاتيح قابلة للتعديل
- 📱 **Responsive Design** - تصميم متجاوب لجميع الأجهزة

---

## 🚀 Quick Start

### المتطلبات المسبقة

قبل البدء، تأكد من تثبيت:

- **Node.js** ≥ 18.x ([تحميل](https://nodejs.org/))
- **npm** ≥ 9.x (يأتي مع Node.js)
- **Git** (اختياري، للنشر) ([تحميل](https://git-scm.com/))

### التثبيت

```bash
# 1. استنساخ المستودع
git clone https://github.com/bahoma31-jpg/codeforge-ide.git

# 2. الدخول إلى المجلد
cd codeforge-ide

# 3. تثبيت المكتبات
npm install

# 4. تشغيل في وضع التطوير
npm run dev
```

سيعمل التطبيق على `http://localhost:3000`

### البناء للإنتاج

```bash
# بناء التطبيق
npm run build

# تشغيل نسخة الإنتاج
npm start
```

---

## 📖 Documentation

### دليل المستخدم

- 📐 [**نظرة عامة على البنية**](./docs/architecture.md) - تفاصيل معمارية التطبيق
- 🔗 [**دليل تكامل Git**](./docs/git-integration.md) - كيفية استخدام Git و GitHub
- 💻 [**أوامر المحطة الطرفية**](./docs/terminal-commands.md) - قائمة كاملة بالأوامر المدعومة
- ⌨️ [**اختصارات لوحة المفاتيح**](./docs/keyboard-shortcuts.md) - جميع الاختصارات المتاحة
- 🤝 [**دليل المساهمة**](./CONTRIBUTING.md) - كيفية المساهمة في المشروع

### مقالات تعليمية

- 🎯 [Getting Started Guide](./docs/getting-started.md)
- 🔧 [Configuration Guide](./docs/configuration.md)
- 🎨 [Customization Guide](./docs/customization.md)
- 🐛 [Troubleshooting](./docs/troubleshooting.md)

---

## 🏗️ Architecture

```
CodeForge IDE
├── 🎨 Frontend (Next.js + React)
│   ├── Monaco Editor (Code Editing)
│   ├── xterm.js (Terminal)
│   └── shadcn/ui (Components)
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
    ├── IndexedDB (File Storage)
    ├── LocalStorage (Settings)
    └── Session Storage (Auth Tokens)
```

### Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Editor** | Monaco Editor |
| **Terminal** | xterm.js |
| **UI Library** | shadcn/ui, Tailwind CSS |
| **State Management** | Zustand |
| **Git Integration** | isomorphic-git |
| **Storage** | IndexedDB, LightningFS |
| **Authentication** | NextAuth.js (GitHub OAuth) |

---

## 🧪 Testing

```bash
# تشغيل الاختبارات
npm run test

# تشغيل الاختبارات مع التغطية
npm run test:coverage

# تشغيل الاختبارات في وضع المراقبة
npm run test:watch
```

### أنواع الاختبارات

- ✅ **Unit Tests** - اختبارات الوحدات للمكونات الفردية
- 🔗 **Integration Tests** - اختبارات التكامل بين الخدمات
- 🎭 **E2E Tests** - اختبارات شاملة للمستخدم النهائي

---

## 🤝 Contributing

نرحب بجميع المساهمات! يرجى قراءة [دليل المساهمة](./CONTRIBUTING.md) قبل البدء.

### خطوات المساهمة

1. **Fork** المشروع
2. **Create** فرع للميزة الجديدة (`git checkout -b feature/AmazingFeature`)
3. **Commit** التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. **Push** إلى الفرع (`git push origin feature/AmazingFeature`)
5. **Open** Pull Request

### قواعد Commit Messages

نستخدم [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semi colons, etc
refactor: code refactoring
test: adding tests
chore: maintain
```

---

## 📝 Roadmap

### Version 1.0 (Current)
- [x] Monaco Editor Integration
- [x] GitHub OAuth
- [x] Basic Git Operations
- [x] Terminal Emulator
- [x] File System

### Version 1.1 (Next)
- [ ] Extensions System
- [ ] Themes Marketplace
- [ ] Collaborative Editing
- [ ] Cloud Sync
- [ ] Mobile Support

### Version 2.0 (Future)
- [ ] AI Code Assistant
- [ ] Live Share
- [ ] Debugging Tools
- [ ] Performance Profiler
- [ ] Container Support

---

## 📄 License

هذا المشروع مرخص بموجب **MIT License** - راجع ملف [LICENSE](./LICENSE) للتفاصيل.

```
MIT License

Copyright (c) 2026 CodeForge IDE Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👥 Team

<div align="center">

تم التطوير بواسطة **bahoma31-jpg** وفريق المساهمين الرائعين

[![GitHub](https://img.shields.io/github/followers/bahoma31-jpg?label=Follow&style=social)](https://github.com/bahoma31-jpg)

</div>

---

## 🙏 Acknowledgments

شكر خاص لـ:

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Microsoft
- [xterm.js](https://xtermjs.org/) - SourceLair
- [isomorphic-git](https://isomorphic-git.org/) - William Hilton
- [shadcn/ui](https://ui.shadcn.com/) - shadcn
- [Next.js](https://nextjs.org/) - Vercel

---

<div align="center">

**⭐ إذا أعجبك المشروع، لا تنسى إضافة نجمة! ⭐**

Made with ❤️ by developers, for developers

</div>
