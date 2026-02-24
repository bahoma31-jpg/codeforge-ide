# Monaco Editor Integration

## Overview
CodeForge IDE uses Monaco Editor (the code editor from VS Code) for a rich code editing experience.

## Features Implemented
- **Syntax Highlighting** for 10+ languages
- **IntelliSense** (TypeScript/JavaScript/HTML/CSS/JSON)
- **Autocomplete** & Code Suggestions
- **Error/Warning Markers** (Diagnostics)
- **Code Actions** & Quick Fixes
- **Theme Integration** (Light/Dark)
- **Keyboard Shortcuts**
- **Multi-Tab Support**
- **Model Caching** (performance)

## Supported Languages

| Language   | Monaco ID   | IntelliSense     |
|-----------|------------|------------------|
| TypeScript | typescript | Full             |
| JavaScript | javascript | Full             |
| HTML       | html       | Tag completion   |
| CSS        | css        | Property completion |
| JSON       | json       | Schema validation |
| Markdown   | markdown   | Basic            |
| Python     | python     | Syntax only      |
| Go         | go         | Syntax only      |
| Rust       | rust       | Syntax only      |

## Custom Themes
- `codeforge-light` - Light theme matching CodeForge design
- `codeforge-dark` - Dark theme matching CodeForge design

Colors defined in `lib/monaco/theme-config.ts`.

## Keyboard Shortcuts

| Shortcut        | Action              |
|----------------|---------------------|
| Ctrl+S (Cmd+S) | Save file (placeholder) |
| Ctrl+F (Cmd+F) | Find                |
| Ctrl+H (Cmd+H) | Replace             |
| Ctrl+Shift+F   | Format document     |
| F2              | Rename symbol       |
| Ctrl+/          | Toggle line comment |

## Configuration
See `lib/monaco/monaco-config.ts` for all editor options.

## Performance Optimizations
1. **Lazy Loading** - Monaco loads only when needed
2. **Model Caching** - Reuse models when switching tabs
3. **Debounced Updates** - 300ms delay for content updates
