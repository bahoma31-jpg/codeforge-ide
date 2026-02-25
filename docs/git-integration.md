# 🔗 Git Integration Guide

## مقدمة

توفر CodeForge IDE تكاملًا كاملًا مع Git و GitHub، مما يسمح لك بإدارة الأكواد والتعاون مع الفريق مباشرة من المتصفح.

---

## 🔐 Connecting to GitHub

### 1. GitHub OAuth Setup

#### خطوات الاتصال

1. **اضغط على أيقونة الملف الشخصي** في الزاوية العلوية اليمنى
2. **اختر "Sign in with GitHub"**
3. **سيتم تحويلك إلى GitHub**
4. **قم بمنح الصلاحيات المطلوبة**:
   - `repo` - الوصول الكامل للمستودعات
   - `user` - قراءة معلومات الملف الشخصي
   - `workflow` - تحديث GitHub Actions

5. **بعد الموافقة، سيتم إعادة توجيهك** إلة التطبيق

#### OAuth Flow Diagram

```
User clicks "Sign in"
         ↓
  Redirect to GitHub OAuth
    (with scopes: repo, user)
         ↓
  User authorizes application
         ↓
  GitHub redirects with code
         ↓
  NextAuth exchanges code for token
         ↓
  Token stored in SessionStorage
         ↓
  App fetches user info & repos
         ↓
  User is authenticated ✓
```

### 2. الصلاحيات المطلوبة

| Scope | الوصف | مطلوب |
|-------|--------|--------|
| `repo` | قراءة وكتابة المستودعات | ✅ |
| `user:email` | قراءة بريد المستخدم | ✅ |
| `workflow` | إدارة GitHub Actions | ☐ |
| `gist` | إدارة Gists | ☐ |

---

## 📦 Git Operations

### 1. Initializing a Repository

#### إنشاء مستودع جديد

```bash
# في المحطة الطرفية
git init
```

**أو عبر الواجهة**:
1. Source Control Panel (من الشريط الجانبي)
2. اضغط على "Initialize Repository"

#### ما يحدث خلف الكواليس

```javascript
import git from 'isomorphic-git';
import { fs } from '@/lib/filesystem';

await git.init({
  fs,
  dir: '/project',
  defaultBranch: 'main'
});

// Creates:
// .git/
// ├── HEAD
// ├── config
// ├── refs/
// └── objects/
```

---

### 2. Cloning a Repository

#### استنساخ مستودع من GitHub

**عبر الواجهة**:
1. Welcome Screen → "Clone Repository"
2. أدخل URL المستودع
3. اختر مجلد الوجهة
4. اضغط "Clone"

**في المحطة الطرفية**:
```bash
git clone https://github.com/username/repo.git
```

#### مع المصادقة

```javascript
await git.clone({
  fs,
  http,
  dir: '/project/repo',
  url: 'https://github.com/username/repo.git',
  onAuth: () => ({
    username: 'token',
    password: githubToken
  }),
  onProgress: (progress) => {
    console.log(`${progress.phase}: ${progress.loaded}/${progress.total}`);
  }
});
```

---

### 3. Staging & Committing

#### إضافة ملفات للمرحلة (Staging)

**عبر الواجهة**:
1. في Git Panel، سترى قائمة "Changes"
2. اضغط على علامة `+` بجانب الملف
3. سيتحرك إلى "Staged Changes"

**في المحطة الطرفية**:
```bash
# إضافة ملف واحد
git add file.js

# إضافة جميع الملفات
git add .

# إضافة ملفات بنمط معين
git add src/**/*.ts
```

#### حفظ التغييرات (Commit)

**عبر الواجهة**:
1. اكتب Commit Message في الحقل
2. اضغط `Ctrl+Enter` أو زر "Commit"

**في المحطة الطرفية**:
```bash
git commit -m "feat: add new feature"

# مع وصف مفصل
git commit -m "feat: add user authentication" -m "Added login and signup functionality with OAuth support"
```

#### Commit Message Best Practices

نستخدم **Conventional Commits**:

```
type(scope): subject

body (optional)

footer (optional)
```

**أنواع الرسائل**:

| Type | الوصف | مثال |
|------|--------|------|
| `feat` | ميزة جديدة | `feat: add dark mode` |
| `fix` | إصلاح خطأ | `fix: resolve login bug` |
| `docs` | توثيق | `docs: update README` |
| `style` | تنسيق | `style: format code` |
| `refactor` | إعادة بناء | `refactor: simplify auth logic` |
| `test` | اختبارات | `test: add unit tests` |
| `chore` | صيانة | `chore: update dependencies` |

---

### 4. Pushing to GitHub

#### رفع التغييرات

**عبر الواجهة**:
1. بعد عمل Commit
2. اضغط على زر "Push" (↑)
3. أو استخدم `Ctrl+Shift+P`

**في المحطة الطرفية**:
```bash
# Push to current branch
git push

# Push with upstream
git push -u origin main

# Force push (حذر!)
git push --force
```

#### معالجة الأخطاء

```bash
# إذا كان الفرع البعيد متقدمًا
Error: Updates were rejected
Hint: Pull before pushing

# الحل:
git pull --rebase
git push
```

---

### 5. Pulling from GitHub

#### جلب التغييرات

**عبر الواجهة**:
1. اضغط على زر "Pull" (↓)
2. أو استخدم Git Panel → "Sync"

**في المحطة الطرفية**:
```bash
# Pull with merge
git pull

# Pull with rebase
git pull --rebase

# Fetch only (no merge)
git fetch
```

---

## 🌿 Branch Management

### 1. Creating Branches

**عبر الواجهة**:
1. في Status Bar بالأسفل، اضغط على اسم الفرع الحالي
2. اختر "Create new branch"
3. أدخل اسم الفرع

**في المحطة الطرفية**:
```bash
# Create and switch
git checkout -b feature/new-feature

# Create only
git branch feature/new-feature
```

### 2. Switching Branches

**عبر الواجهة**:
1. في Status Bar، اضغط على اسم الفرع
2. اختر الفرع المطلوب

**في المحطة الطرفية**:
```bash
git checkout main
git checkout feature/new-feature

# مع switch (الأحدث)
git switch main
```

### 3. Merging Branches

**عبر الواجهة**:
1. انتقل إلى الفرع المستهدف (main)
2. Git Panel → "Merge Branch"
3. اختر الفرع المراد دمجه

**في المحطة الطرفية**:
```bash
# Switch to target branch
git checkout main

# Merge feature branch
git merge feature/new-feature

# Delete merged branch
git branch -d feature/new-feature
```

### 4. Deleting Branches

```bash
# Delete local branch
git branch -d branch-name

# Force delete
git branch -D branch-name

# Delete remote branch
git push origin --delete branch-name
```

---

## ⚔️ Conflict Resolution

### فهم التعارضات

تحدته التعارضات عندما:
- يتم تعديل نفس السطر في فرعين مختلفين
- يتم حذف ملف في فرع وتعديله في فرع آخر

### معالجة التعارضات بصريًا

**عند حدوث تعارض**:

1. **سيظهر تنبيه** في الواجهة
2. **افتح الملف المتعارض**
3. **سترى علامات التعارض**:

```javascript
<<<<<<< HEAD (Current Change)
const message = "Hello from main";
=======
const message = "Hello from feature";
>>>>>>> feature/new-feature (Incoming Change)
```

4. **اختر أحد الخيارات**:
   - Accept Current Change
   - Accept Incoming Change
   - Accept Both Changes
   - Compare Changes

5. **بعد الحل، قم بـ**:
```bash
git add file.js
git commit -m "resolve: merge conflict in file.js"
```

### استراتيجيات حل التعارضات

#### 1. Accept Ours (التغييرات الحالية)
```bash
git checkout --ours file.js
git add file.js
```

#### 2. Accept Theirs (التغييرات الواردة)
```bash
git checkout --theirs file.js
git add file.js
```

#### 3. Manual Resolution (يدويًا)
```bash
# عدل الملف يدويًا
# ثم:
git add file.js
git commit -m "resolve: manual conflict resolution"
```

### إلغاء الدمج

إذا أردت التراجع:

```bash
git merge --abort
```

---

## 🔄 Advanced Operations

### 1. Stashing Changes

**حفظ مؤقت للتغييرات**:

```bash
# Save changes
git stash

# Save with message
git stash save "WIP: working on feature"

# List stashes
git stash list

# Apply stash
git stash apply

# Apply and drop
git stash pop

# Drop stash
git stash drop stash@{0}
```

### 2. Cherry-picking

**تطبيق commit محدد**:

```bash
# Apply specific commit
git cherry-pick <commit-hash>

# Cherry-pick range
git cherry-pick <start-hash>^..<end-hash>
```

### 3. Reverting Changes

**التراجع عن commit**:

```bash
# Revert last commit
git revert HEAD

# Revert specific commit
git revert <commit-hash>

# Revert without commit
git revert --no-commit <commit-hash>
```

### 4. Reset Operations

```bash
# Soft reset (keep changes staged)
git reset --soft HEAD~1

# Mixed reset (keep changes unstaged)
git reset HEAD~1

# Hard reset (حذر! يحذف التغييرات)
git reset --hard HEAD~1
```

---

## 📊 Viewing History

### Git Log

```bash
# Basic log
git log

# One line per commit
git log --oneline

# With graph
git log --graph --oneline --all

# Last 5 commits
git log -5

# By author
git log --author="username"

# By date
git log --since="2024-01-01" --until="2024-12-31"

# File history
git log -- file.js
```

### Diff Operations

```bash
# Unstaged changes
git diff

# Staged changes
git diff --staged

# Between branches
git diff main..feature/branch

# Specific file
git diff file.js
```

---

## ⚙️ Configuration

### Global Settings

```bash
# User info
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Default branch
git config --global init.defaultBranch main

# Editor
git config --global core.editor "code --wait"

# View config
git config --list
```

### Repository Settings

```bash
# Remote URLs
git remote -v
git remote set-url origin https://github.com/user/repo.git

# Add remote
git remote add upstream https://github.com/original/repo.git
```

---

## 🔒 Best Practices

### 1. Commit Frequently
- عمل commits صغيرة ومتركزة
- كل commit يجب أن يعمل بشكل مستقل

### 2. Write Clear Commit Messages
- استخدم Conventional Commits
- كن واضحًا ومحددًا

### 3. Pull Before Push
- دائمًا اعمل pull قبل push
- يجنب التعارضات

### 4. Use Branches
- فرع جديد لكل ميزة
- لا تعمل مباشرة على main

### 5. Review Before Committing
- راجع git status
- راجع git diff
- تأكد من الملفات المراد حفظها

---

## 🐛 Common Issues

### Issue 1: Authentication Failed

**الحل**:
1. تأكد من أنك مسجل دخول GitHub
2. تحقق من صلاحيات الـ token
3. أعد تسجيل الدخول

### Issue 2: Merge Conflicts

**الحل**:
1. استخدم أدوات حل التعارضات في الواجهة
2. عدل يدويًا إذا لزم الأمر
3. تأكد من git add بعد الحل

### Issue 3: Detached HEAD

**الحل**:
```bash
# Create branch from detached state
git checkout -b new-branch-name

# Or return to main
git checkout main
```

---

## 📚 Additional Resources

- [isomorphic-git Documentation](https://isomorphic-git.org/)
- [GitHub REST API](https://docs.github.com/rest)
- [Git Book](https://git-scm.com/book/en/v2)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**للمزيد من المساعدة**: [أوامر المحطة الطرفية](./terminal-commands.md) | [نظرة عامة على البنية](./architecture.md)
