# 💻 Terminal Commands Reference

## مقدمة

المحطة الطرفية في CodeForge IDE توفر أوامر متعددة تشبه Unix shell مع دعم كامل لأوامر Git.

---

## 📁 File System Commands

### `ls` - List Directory Contents

**الاستخدام**:
```bash
ls [options] [path]
```

**الخيارات**:
- `-l` : عرض تفصيلي
- `-a` : إظهار الملفات المخفية
- `-h` : حجم قابل للقراءة

**أمثلة**:
```bash
ls                  # List current directory
ls -la              # List all files with details
ls src/             # List specific directory
ls -lh              # List with human-readable sizes
```

---

### `cd` - Change Directory

**الاستخدام**:
```bash
cd [path]
```

**أمثلة**:
```bash
cd /project         # Absolute path
cd src              # Relative path
cd ..               # Parent directory
cd ~                # Home directory
cd -                # Previous directory
```

---

### `pwd` - Print Working Directory

**الاستخدام**:
```bash
pwd
```

**مثال**:
```bash
$ pwd
/project/src/components
```

---

### `mkdir` - Make Directory

**الاستخدام**:
```bash
mkdir [options] <directory>
```

**الخيارات**:
- `-p` : إنشاء المجلدات الأب إذا لم تكن موجودة

**أمثلة**:
```bash
mkdir new-folder
mkdir -p src/components/ui    # Create nested directories
```

---

### `touch` - Create File

**الاستخدام**:
```bash
touch <filename>
```

**أمثلة**:
```bash
touch index.html
touch src/app.ts
touch file1.js file2.js file3.js    # Multiple files
```

---

### `cat` - Display File Contents

**الاستخدام**:
```bash
cat <filename>
```

**أمثلة**:
```bash
cat README.md
cat package.json
```

---

### `rm` - Remove Files/Directories

**الاستخدام**:
```bash
rm [options] <file>
```

**الخيارات**:
- `-r` : حذف مجلد وما بداخله
- `-f` : فرض الحذف بدون تأكيد

**أمثلة**:
```bash
rm file.txt
rm -r folder/          # Remove directory
rm -rf node_modules/   # Force remove directory
```

⚠️ **تحذير**: لا يمكن التراجع عن `rm -rf`

---

### `cp` - Copy Files

**الاستخدام**:
```bash
cp [options] <source> <destination>
```

**الخيارات**:
- `-r` : نسخ مجلد كامل

**أمثلة**:
```bash
cp file.txt file-copy.txt
cp -r src/ backup/
```

---

### `mv` - Move/Rename Files

**الاستخدام**:
```bash
mv <source> <destination>
```

**أمثلة**:
```bash
mv old-name.txt new-name.txt    # Rename
mv file.txt src/                # Move
```

---

## 🔀 Git Commands

### `git init` - Initialize Repository

```bash
git init
```

---

### `git clone` - Clone Repository

```bash
git clone <url>
git clone https://github.com/user/repo.git
```

---

### `git status` - Repository Status

```bash
git status
git status -s    # Short format
```

---

### `git add` - Stage Changes

```bash
git add <file>
git add .                    # All files
git add src/**/*.js          # Pattern
git add -A                   # All changes
```

---

### `git commit` - Commit Changes

```bash
git commit -m "message"
git commit -m "title" -m "description"
git commit --amend           # Amend last commit
```

---

### `git push` - Push to Remote

```bash
git push
git push origin main
git push -u origin feature-branch
git push --force             # Force push (⚠️ danger)
```

---

### `git pull` - Pull from Remote

```bash
git pull
git pull origin main
git pull --rebase
```

---

### `git fetch` - Fetch from Remote

```bash
git fetch
git fetch origin
git fetch --all
```

---

### `git branch` - Branch Management

```bash
git branch                   # List branches
git branch new-branch        # Create branch
git branch -d branch-name    # Delete branch
git branch -D branch-name    # Force delete
git branch -m new-name       # Rename current branch
```

---

### `git checkout` - Switch Branches

```bash
git checkout main
git checkout -b new-branch   # Create and switch
git checkout -- file.txt     # Discard changes
```

---

### `git merge` - Merge Branches

```bash
git merge feature-branch
git merge --no-ff feature-branch
git merge --abort            # Abort merge
```

---

### `git log` - View History

```bash
git log
git log --oneline
git log --graph --all
git log -5                   # Last 5 commits
git log --author="name"
```

---

### `git diff` - Show Differences

```bash
git diff
git diff --staged
git diff main..feature
git diff HEAD~1 HEAD
```

---

### `git stash` - Stash Changes

```bash
git stash
git stash save "message"
git stash list
git stash apply
git stash pop
git stash drop
```

---

### `git reset` - Reset Changes

```bash
git reset HEAD file.txt      # Unstage
git reset --soft HEAD~1      # Keep changes
git reset --hard HEAD~1      # Discard changes (⚠️)
```

---

### `git revert` - Revert Commit

```bash
git revert HEAD
git revert <commit-hash>
```

---

## 🔍 Utility Commands

### `echo` - Print Text

```bash
echo "Hello World"
echo $USER
```

---

### `clear` - Clear Screen

```bash
clear
```

أو: `Ctrl+L`

---

### `history` - Command History

```bash
history          # Show history
history 10       # Last 10 commands
```

استخدم `↑` و `↓` للتنقل في السجل

---

### `help` - Show Help

```bash
help
help <command>
```

---

## ⌨️ Terminal Shortcuts

| Shortcut | الوصف |
|----------|--------|
| `Ctrl+C` | إيقاف الأمر الحالي |
| `Ctrl+L` | مسح الشاشة |
| `Ctrl+U` | حذف السطر من الموضع للبداية |
| `Ctrl+K` | حذف السطر من الموضع للنهاية |
| `Ctrl+W` | حذف الكلمة السابقة |
| `Ctrl+A` | الانتقال لبداية السطر |
| `Ctrl+E` | الانتقال لنهاية السطر |
| `↑` / `↓` | تصفح سجل الأوامر |
| `Tab` | إكمال تلقائي |

---

## 📊 Examples & Workflows

### Workflow 1: Start New Project

```bash
# Create project structure
mkdir my-project
cd my-project
mkdir src tests docs
touch README.md
touch src/index.js

# Initialize Git
git init
git add .
git commit -m "Initial commit"

# Connect to GitHub
git remote add origin https://github.com/user/repo.git
git push -u origin main
```

---

### Workflow 2: Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
touch src/feature.js

# Commit changes
git add src/feature.js
git commit -m "feat: add new feature"

# Push to remote
git push -u origin feature/new-feature

# Merge to main
git checkout main
git merge feature/new-feature
git push

# Delete feature branch
git branch -d feature/new-feature
```

---

### Workflow 3: Fix Production Bug

```bash
# Create hotfix branch
git checkout -b hotfix/bug-fix

# Fix the bug
# ...

# Commit fix
git add .
git commit -m "fix: resolve critical bug"

# Merge to main
git checkout main
git merge hotfix/bug-fix
git push

# Tag the release
git tag -a v1.0.1 -m "Hotfix release"
git push --tags
```

---

## 🚫 Commands Not Supported

**هذه الأوامر غير مدعومة في المتصفح**:

- `npm` / `yarn` / `pnpm` (package managers)
- `node` (Node.js runtime)
- `python` / `ruby` / `php` (language runtimes)
- `ssh` / `scp` (remote connection)
- `sudo` (superuser access)
- `apt` / `yum` (system package managers)

**السبب**: قيود المتصفح الأمنية

---

## 💡 Tips & Tricks

### 1. Command Aliases

```bash
# في المحطة الطرفية:
alias gs="git status"
alias ga="git add ."
alias gc="git commit -m"

# الاستخدام:
gs              # same as git status
ga              # same as git add .
gc "message"    # same as git commit -m "message"
```

### 2. Tab Completion

- اضغط `Tab` لإكمال أسماء الملفات والمجلدات
- اضغط `Tab` مرتين لعرض الخيارات المتاحة

### 3. Command History Search

- `Ctrl+R` للبحث في سجل الأوامر
- اكتب جزء من الأمر
- اضغط `Enter` للتنفيذ

---

## 🐛 Troubleshooting

### مشكلة: Command not found

**الحل**:
- تحقق من التهجئة
- استخدم `help` لرؤية الأوامر المتاحة

### مشكلة: Permission denied

**الحل**:
- تحقق من صلاحيات الملف
- في المتصفح، لا يوجد نظام صلاحيات حقيقي

### مشكلة: Fatal error in Git

**الحل**:
1. تحقق من اتصال الإنترنت
2. تحقق من مصادقة GitHub
3. تحقق من صلاحيات المستودع

---

📚 **للمزيد من المعلومات**: [Git Integration Guide](./git-integration.md)
