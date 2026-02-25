# 💻 Terminal Commands Reference

## Table of Contents

1. [Overview](#overview)
2. [Basic Commands](#basic-commands)
3. [File Operations](#file-operations)
4. [Git Commands](#git-commands)
5. [Terminal Management](#terminal-management)
6. [Advanced Features](#advanced-features)
7. [Custom Commands](#custom-commands)

---

## Overview

CodeForge IDE includes an integrated terminal powered by **xterm.js**, supporting:

- ✅ Basic shell commands
- ✅ File system operations
- ✅ Git commands integration
- ✅ Command history (Up/Down arrows)
- ✅ Tab completion
- ✅ Multiple terminal instances
- ✅ Customizable appearance

### Supported Shells

- **Simulated Shell**: Built-in JavaScript shell (default)
- **Git Integration**: Direct isomorphic-git commands
- **File System**: IndexedDB-based operations

---

## Basic Commands

### Navigation

| Command | Description | Example |
|---------|-------------|----------|
| `pwd` | Print working directory | `pwd` |
| `cd` | Change directory | `cd src/components` |
| `ls` | List files | `ls` or `ls -la` |
| `clear` | Clear terminal | `clear` |

**Examples:**

```bash
# Check current directory
pwd
# Output: /my-project

# Navigate to subdirectory
cd src
pwd
# Output: /my-project/src

# Go back to parent
cd ..
pwd
# Output: /my-project

# Go to root
cd /
```

### System Commands

| Command | Description | Example |
|---------|-------------|----------|
| `echo` | Print text | `echo "Hello World"` |
| `date` | Show current date/time | `date` |
| `help` | Show available commands | `help` |
| `exit` | Close terminal | `exit` |

**Examples:**

```bash
# Print message
echo "Building project..."

# Show timestamp
date
# Output: Wed Feb 25 2026 05:12:00 GMT+0100

# List all commands
help
```

---

## File Operations

### Viewing Files

| Command | Description | Example |
|---------|-------------|----------|
| `cat` | Display file content | `cat README.md` |
| `head` | Show first lines | `head -n 10 file.txt` |
| `tail` | Show last lines | `tail -n 20 file.log` |
| `less` | Paginated viewer | `less longfile.txt` |

### Creating Files

| Command | Description | Example |
|---------|-------------|----------|
| `touch` | Create empty file | `touch newfile.js` |
| `mkdir` | Create directory | `mkdir components` |
| `echo >` | Create file with content | `echo "content" > file.txt` |

**Examples:**

```bash
# Create new file
touch src/utils.ts

# Create directory structure
mkdir -p src/components/ui

# Create file with content
echo "export default {}" > src/index.ts
```

### Copying & Moving

| Command | Description | Example |
|---------|-------------|----------|
| `cp` | Copy file | `cp file.js backup.js` |
| `mv` | Move/rename file | `mv old.js new.js` |
| `rm` | Remove file | `rm file.js` |
| `rmdir` | Remove empty directory | `rmdir empty-folder` |

**Examples:**

```bash
# Copy file
cp src/index.ts src/index.backup.ts

# Rename file
mv old-name.js new-name.js

# Delete file
rm unwanted.js

# Delete directory and contents
rm -rf node_modules
```

### Searching

| Command | Description | Example |
|---------|-------------|----------|
| `find` | Find files | `find . -name "*.js"` |
| `grep` | Search in files | `grep "TODO" src/**/*.ts` |

**Examples:**

```bash
# Find all TypeScript files
find . -name "*.ts"

# Find files modified today
find . -mtime -1

# Search for text in files
grep -r "function" src/

# Case-insensitive search
grep -ri "error" logs/
```

---

## Git Commands

### Repository Initialization

```bash
# Initialize new Git repository
git init

# Clone existing repository
git clone https://github.com/user/repo.git
```

### Basic Workflow

```bash
# Check status
git status

# Stage files
git add src/index.ts
git add .  # Stage all

# Commit
git commit -m "feat: add new feature"

# Push to remote
git push origin main

# Pull from remote
git pull origin main
```

### Branch Management

```bash
# List branches
git branch
git branch -a  # Include remote

# Create branch
git branch feature/new-feature

# Switch branch
git checkout feature/new-feature
# Or: git switch feature/new-feature

# Create and switch
git checkout -b hotfix/bug-fix

# Delete branch
git branch -d old-branch
```

### History & Inspection

```bash
# View commit log
git log
git log --oneline
git log --graph

# Show commit details
git show abc123

# View differences
git diff
git diff --staged
git diff HEAD~1

# File history
git log -- src/index.ts
```

### Advanced Git

```bash
# Stash changes
git stash
git stash save "work in progress"
git stash list
git stash pop

# Rebase
git rebase main
git rebase -i HEAD~3  # Interactive

# Cherry-pick
git cherry-pick abc123

# Tags
git tag v1.0.0
git tag -a v1.0.0 -m "Release 1.0"
git push --tags

# Reset
git reset --soft HEAD~1
git reset --hard HEAD~1

# Revert
git revert abc123
```

---

## Terminal Management

### Multiple Terminals

| Keyboard Shortcut | Action |
|-------------------|--------|
| `Ctrl + ` ` | Toggle terminal |
| `Ctrl + Shift + ` ` | New terminal |
| `Ctrl + Shift + W` | Close terminal |
| `Ctrl + Tab` | Next terminal |
| `Ctrl + Shift + Tab` | Previous terminal |

### Terminal Commands

```bash
# Clear screen
clear
# Or: Ctrl+L

# Exit terminal
exit

# Show command history
history

# Run previous command
!!

# Run command from history
!42  # Run command #42
```

---

## Advanced Features

### Command History

```bash
# Navigate history
Up Arrow    # Previous command
Down Arrow  # Next command

# Search history
Ctrl+R      # Reverse search

# Clear history
history -c
```

### Tab Completion

```bash
# File/directory completion
cd sr[TAB]  # Completes to "src"

# Command completion
gi[TAB]     # Completes to "git"

# Git branch completion
git checkout fe[TAB]  # Completes to "feature/..."
```

### Piping & Redirection

```bash
# Redirect output to file
ls > files.txt
echo "log" >> output.log  # Append

# Pipe commands
ls | grep ".js"
cat file.txt | grep "error" | wc -l

# Redirect errors
command 2> errors.log
command &> all-output.log
```

### Background Jobs

```bash
# Run in background
command &

# List jobs
jobs

# Bring to foreground
fg %1

# Send to background
bg %1

# Kill job
kill %1
```

---

## Custom Commands

### Aliases

Create custom command shortcuts:

```bash
# Set alias
alias gs="git status"
alias gp="git push"
alias gc="git commit -m"

# Use alias
gs  # Runs: git status
gc "fix: bug"  # Runs: git commit -m "fix: bug"

# List aliases
alias

# Remove alias
unalias gs
```

### Functions

Create reusable command functions:

```bash
# Define function
function gitpush() {
  git add .
  git commit -m "$1"
  git push
}

# Use function
gitpush "feat: add feature"
```

---

## Environment Variables

```bash
# View all variables
env

# Set variable
export NODE_ENV=production

# Use variable
echo $NODE_ENV
echo $HOME
echo $PWD

# Unset variable
unset NODE_ENV
```

---

## Tips & Tricks

### 1. **Keyboard Shortcuts**

```
Ctrl+C   # Cancel current command
Ctrl+D   # End of input (EOF)
Ctrl+L   # Clear screen
Ctrl+A   # Move to start of line
Ctrl+E   # Move to end of line
Ctrl+U   # Clear line before cursor
Ctrl+K   # Clear line after cursor
Ctrl+W   # Delete word before cursor
```

### 2. **Quick Navigation**

```bash
cd -     # Go to previous directory
cd ~     # Go to home directory
cd       # Go to home directory (same as above)
```

### 3. **Command Substitution**

```bash
echo "Today is $(date)"
file_count=$(ls | wc -l)
echo "Files: $file_count"
```

### 4. **Multiple Commands**

```bash
# Run sequentially
command1; command2; command3

# Run if previous succeeds
command1 && command2 && command3

# Run if previous fails
command1 || command2
```

---

## Troubleshooting

### Command Not Found

```bash
# Check if command exists
which git

# Show command help
git --help
ls --help
```

### Permission Denied

```bash
# Some operations may require elevated access
# Check file permissions
ls -l file.txt
```

### Terminal Frozen

```bash
# Unfreeze terminal
Ctrl+Q

# If stuck, close and create new terminal
Ctrl+Shift+W  # Close current
Ctrl+Shift+`  # Open new
```

---

## Command Reference Table

### Quick Reference

| Category | Command | Action |
|----------|---------|--------|
| **Navigation** | `cd`, `pwd`, `ls` | Directory operations |
| **Files** | `cat`, `touch`, `rm` | File operations |
| **Git** | `git add`, `git commit` | Version control |
| **Terminal** | `clear`, `exit`, `history` | Terminal management |
| **Search** | `find`, `grep` | File/text search |
| **System** | `echo`, `date`, `env` | System utilities |

---

## Supported Command List

### Full Command Support

```
Basic Commands:
  cd, pwd, ls, clear, echo, date, help, exit

File Operations:
  cat, touch, mkdir, cp, mv, rm, rmdir, head, tail, less
  find, grep

Git Commands:
  git init, git clone, git status, git add, git commit
  git push, git pull, git branch, git checkout, git merge
  git log, git diff, git show, git stash, git tag
  git rebase, git cherry-pick, git reset, git revert

Terminal Management:
  history, alias, unalias, env, export, unset
  jobs, fg, bg, kill

Utilities:
  wc, sort, uniq, cut, sed, awk (limited)
```

---

**Last Updated**: Phase 8 (February 2026)
