# 🧪 Terminal Emulator Testing Guide

## Quick Start Testing

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Browser
```
http://localhost:3000
```

### 3. Open Terminal Panel
- Click on **"Terminal"** tab in bottom panel
- Or use keyboard shortcut: `Ctrl+\``

---

## ✅ Basic Functionality Tests

### Test 1: Terminal Creation

**Steps**:
1. Click the **+** button in terminal tab bar
2. Verify new terminal is created
3. Repeat 4 more times (total 5 terminals)
4. Try to create 6th terminal

**Expected Results**:
- ✅ 5 terminals created successfully
- ✅ Terminal count shows "5/5"
- ✅ 6th attempt shows alert: "Maximum 5 terminals allowed"
- ✅ **+** button becomes disabled

---

### Test 2: Terminal Switching

**Steps**:
1. Create 3 terminals
2. Click on each tab to switch
3. Use `Ctrl+Tab` to switch forward
4. Use `Ctrl+Shift+Tab` to switch backward

**Expected Results**:
- ✅ Clicking tab activates that terminal
- ✅ Active tab is highlighted
- ✅ `Ctrl+Tab` cycles forward
- ✅ `Ctrl+Shift+Tab` cycles backward
- ✅ Terminal content changes when switching

---

### Test 3: Terminal Closing

**Steps**:
1. Create 3 terminals
2. Hover over a tab
3. Click the **✕** button
4. Use `Ctrl+Shift+W` to close active terminal

**Expected Results**:
- ✅ **✕** button appears on hover
- ✅ Terminal closes when clicked
- ✅ Next terminal becomes active
- ✅ `Ctrl+Shift+W` closes current terminal
- ✅ Terminal count updates correctly

---

### Test 4: Title Editing

**Steps**:
1. Create a terminal
2. Double-click on the title
3. Type new name: "My Terminal"
4. Press Enter
5. Press Escape while editing another title

**Expected Results**:
- ✅ Input field appears on double-click
- ✅ Title is selected automatically
- ✅ Enter saves the new title
- ✅ Escape cancels editing
- ✅ Title updates in tab

---

## 💻 Command Execution Tests

### Test 5: File Navigation Commands

**Test 5.1: `ls` Command**
```bash
$ ls
```
**Expected**: List of files in current directory

**Test 5.2: `cd` Command**
```bash
$ cd src
$ pwd
```
**Expected**: 
- Current directory changes to "src"
- `pwd` shows full path

**Test 5.3: `pwd` Command**
```bash
$ pwd
```
**Expected**: Shows current working directory (e.g., `/project`)

---

### Test 6: File Operations

**Test 6.1: Create Directory**
```bash
$ mkdir test-folder
$ ls
```
**Expected**: 
- "test-folder" appears in file tree
- `ls` shows the new folder

**Test 6.2: Create File**
```bash
$ touch test.txt
$ ls
```
**Expected**:
- "test.txt" appears in file tree
- `ls` shows the new file

**Test 6.3: View File Content**
```bash
$ cat package.json
```
**Expected**: Displays package.json content

**Test 6.4: Delete File**
```bash
$ rm test.txt
$ ls
```
**Expected**:
- "test.txt" removed from file tree
- `ls` doesn't show the file

---

### Test 7: Git Commands

**Prerequisites**: Initialize a Git repository first

**Test 7.1: Git Status**
```bash
$ git status
```
**Expected**: Shows current branch and file status

**Test 7.2: Stage Files**
```bash
$ touch new-file.ts
$ git add new-file.ts
$ git status
```
**Expected**:
- File appears in staged changes
- Green color indicates staged

**Test 7.3: Commit**
```bash
$ git commit -m "test: add new file"
```
**Expected**:
- Success message
- Commit appears in Git History

**Test 7.4: View Branches**
```bash
$ git branch
```
**Expected**: Lists all branches, highlights current

**Test 7.5: View Commit Log**
```bash
$ git log
```
**Expected**: Shows recent commits with messages

---

### Test 8: Utility Commands

**Test 8.1: Echo**
```bash
$ echo "Hello World"
```
**Expected**: Prints "Hello World"

**Test 8.2: Clear Screen**
```bash
$ clear
```
**Expected**: Terminal screen clears

**Test 8.3: Help**
```bash
$ help
```
**Expected**: Shows list of available commands

**Test 8.4: Exit**
```bash
$ exit
```
**Expected**: Terminal closes

---

## ⌨️ Interactive Features Tests

### Test 9: Command History

**Steps**:
1. Execute several commands:
   ```bash
   $ ls
   $ pwd
   $ git status
   $ echo "test"
   ```
2. Press **↑** (Up Arrow) multiple times
3. Press **↓** (Down Arrow)

**Expected Results**:
- ✅ ↑ shows previous commands in reverse order
- ✅ ↓ shows next commands forward
- ✅ Commands appear in prompt ready to execute
- ✅ Can edit recalled commands

---

### Test 10: Tab Completion

**Test 10.1: File/Directory Completion**
```bash
$ cd co[TAB]
```
**Expected**: Autocompletes to "components" (or closest match)

**Test 10.2: Command Completion**
```bash
$ git st[TAB]
```
**Expected**: Autocompletes to "git status"

**Test 10.3: Multiple Matches**
```bash
$ git [TAB][TAB]
```
**Expected**: Shows list of git subcommands

---

### Test 11: Copy & Paste

**Test 11.1: Copy Text**
**Steps**:
1. Execute: `$ echo "Copy this text"`
2. Select output text with mouse
3. Press `Ctrl+C` (or `Cmd+C` on Mac)

**Expected**: Text copied to clipboard

**Test 11.2: Paste Text**
**Steps**:
1. Copy some text externally
2. In terminal, press `Ctrl+V` (or `Cmd+V`)

**Expected**: Text appears in terminal prompt

**Test 11.3: Right-Click Context Menu**
**Steps**:
1. Right-click in terminal
2. Select "Copy" or "Paste"

**Expected**: Context menu appears with options

---

### Test 12: Auto-Resize

**Steps**:
1. Open terminal
2. Resize browser window
3. Drag bottom panel splitter up/down
4. Switch to fullscreen mode

**Expected Results**:
- ✅ Terminal resizes automatically
- ✅ No text overflow or cut-off
- ✅ Columns adjust to fit width
- ✅ Rows adjust to fit height

---

## ⚠️ Error Handling Tests

### Test 13: Invalid Commands

**Test 13.1: Unknown Command**
```bash
$ invalid_command
```
**Expected**: 
```
Error: Command not found: invalid_command
Type 'help' to see available commands.
```

**Test 13.2: Missing Arguments**
```bash
$ cd
```
**Expected**: Error message about missing path

**Test 13.3: Invalid Path**
```bash
$ cd /nonexistent/path
```
**Expected**: Error message about invalid path

---

### Test 14: File Operation Errors

**Test 14.1: File Not Found**
```bash
$ cat nonexistent.txt
```
**Expected**: `Error: File not found: nonexistent.txt`

**Test 14.2: Delete Non-Existent File**
```bash
$ rm missing.txt
```
**Expected**: Error message

---

### Test 15: Git Errors

**Test 15.1: Commit Without Staging**
```bash
$ git commit -m "test"
```
**Expected**: `Error: Nothing to commit. Use 'git add' first.`

**Test 15.2: Invalid Git Command**
```bash
$ git invalid
```
**Expected**: Error message about unknown git command

---

## 🎨 UI/UX Tests

### Test 16: Visual Appearance

**Check**:
- ✅ Terminal background matches theme
- ✅ Text is readable with good contrast
- ✅ Cursor is visible and blinks
- ✅ ANSI colors display correctly:
  - Red for errors
  - Green for success
  - Cyan for info
  - Blue for prompts

---

### Test 17: Keyboard Shortcuts Display

**Check Bottom Bar**:
- ✅ Shows: `Ctrl+Shift+\`` for new terminal
- ✅ Shows: `Ctrl+Shift+W` for close
- ✅ Shows: `Ctrl+Tab` for switch
- ✅ Hints are always visible

---

### Test 18: Terminal Count Indicator

**Steps**:
1. Create terminals one by one
2. Watch counter in top-right

**Expected**:
- ✅ Shows "1/5", "2/5", etc.
- ✅ Updates in real-time
- ✅ Turns red at "5/5"

---

## 🔗 Integration Tests

### Test 19: Files Store Integration

**Steps**:
1. Create file via terminal: `$ touch test.ts`
2. Check file explorer
3. Create file via explorer UI
4. Check terminal: `$ ls`

**Expected**:
- ✅ Files created in terminal appear in explorer
- ✅ Files created in explorer visible in terminal
- ✅ Bidirectional sync works

---

### Test 20: Git Store Integration

**Steps**:
1. Stage file via terminal: `$ git add test.ts`
2. Check Source Control panel
3. Commit via terminal: `$ git commit -m "test"`
4. Check Git History

**Expected**:
- ✅ Staged files appear in Source Control
- ✅ Commits appear in Git History
- ✅ Git status syncs correctly

---

## 🔒 SSR Safety Tests

### Test 21: Next.js Server Rendering

**Steps**:
1. Stop dev server
2. Run production build:
   ```bash
   npm run build
   npm run start
   ```
3. Open browser and navigate to app
4. Check browser console for errors

**Expected Results**:
- ✅ No hydration errors
- ✅ No "ReferenceError: window is not defined"
- ✅ Terminal loads after client-side hydration
- ✅ Loading spinner shows during mount

---

## 📝 TypeScript Tests

### Test 22: Type Safety

**Check in IDE**:
```bash
npm run lint
```

**Expected**:
- ✅ No TypeScript errors
- ✅ No `any` types used
- ✅ All props properly typed
- ✅ Store actions have correct signatures

---

## 🚀 Performance Tests

### Test 23: Multiple Terminal Performance

**Steps**:
1. Create 5 terminals
2. Execute commands in each:
   ```bash
   $ ls
   $ git status
   $ cat package.json
   ```
3. Switch between terminals rapidly

**Expected**:
- ✅ No lag when switching
- ✅ Commands execute quickly
- ✅ No memory leaks
- ✅ Smooth scrolling

---

### Test 24: Large Output Handling

**Steps**:
1. Execute command with large output:
   ```bash
   $ cat very-large-file.json
   ```
2. Scroll through output

**Expected**:
- ✅ Handles large output without freezing
- ✅ Scroll performance is smooth
- ✅ Memory usage stays reasonable

---

## 📊 Test Results Template

### Terminal Emulator Test Report

**Date**: _______________________  
**Tester**: _____________________  
**Browser**: ____________________  
**OS**: _________________________

#### Basic Functionality
- [ ] Test 1: Terminal Creation
- [ ] Test 2: Terminal Switching
- [ ] Test 3: Terminal Closing
- [ ] Test 4: Title Editing

#### Command Execution
- [ ] Test 5: File Navigation
- [ ] Test 6: File Operations
- [ ] Test 7: Git Commands
- [ ] Test 8: Utility Commands

#### Interactive Features
- [ ] Test 9: Command History
- [ ] Test 10: Tab Completion
- [ ] Test 11: Copy & Paste
- [ ] Test 12: Auto-Resize

#### Error Handling
- [ ] Test 13: Invalid Commands
- [ ] Test 14: File Errors
- [ ] Test 15: Git Errors

#### UI/UX
- [ ] Test 16: Visual Appearance
- [ ] Test 17: Keyboard Shortcuts
- [ ] Test 18: Terminal Counter

#### Integration
- [ ] Test 19: Files Store
- [ ] Test 20: Git Store

#### Technical
- [ ] Test 21: SSR Safety
- [ ] Test 22: Type Safety
- [ ] Test 23: Performance
- [ ] Test 24: Large Output

---

## 🐞 Known Issues / Notes

_Record any bugs or unexpected behavior here:_

---

## ✅ Sign-Off

**All tests passed**: [ ]  
**Tests passed with minor issues**: [ ]  
**Tests failed**: [ ]  

**Notes**: ___________________________________________

---

**Testing Complete** 🎉
