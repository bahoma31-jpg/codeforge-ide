/**
 * CodeForge IDE - Terminal Emulator
 * Phase 5: Terminal Emulator Integration
 * Agent 6: Terminal Emulator Engineer
 *
 * Core terminal component wrapping xterm.js with simulated shell commands.
 * Supports command history, ANSI colors, and git integration.
 */

'use client';

import { useEffect, useRef } from 'react';
import type { Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import type { WebLinksAddon } from '@xterm/addon-web-links';
import { useGitStore } from '@/lib/stores/git-store';

/**
 * Terminal emulator props
 */
interface TerminalEmulatorProps {
  /** Unique instance identifier */
  instanceId: string;
  /** Whether this terminal is currently visible */
  isVisible: boolean;
}

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
} as const;

/**
 * Mock file system structure
 */
interface MockFileSystem {
  [key: string]: {
    type: 'file' | 'directory';
    content?: string;
    children?: string[];
  };
}

/**
 * Terminal Emulator Component
 * Wraps xterm.js with a simulated shell environment.
 */
export default function TerminalEmulator({
  instanceId,
  isVisible,
}: TerminalEmulatorProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Terminal state
  const currentLineRef = useRef<string>('');
  const cursorPositionRef = useRef<number>(0);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const currentDirectoryRef = useRef<string>('/workspace');

  // Mock file system
  const fileSystemRef = useRef<MockFileSystem>({
    '/workspace': {
      type: 'directory',
      children: ['src', 'public', 'README.md', 'package.json'],
    },
    '/workspace/src': {
      type: 'directory',
      children: ['app', 'components', 'lib'],
    },
    '/workspace/public': {
      type: 'directory',
      children: ['favicon.ico', 'logo.svg'],
    },
    '/workspace/README.md': {
      type: 'file',
      content: '# CodeForge IDE\n\nA modern web-based code editor.\n',
    },
    '/workspace/package.json': {
      type: 'file',
      content: '{\n  "name": "codeforge-ide",\n  "version": "0.1.0"\n}\n',
    },
  });

  /**
   * Converts HSL color from CSS variable to hex
   */
  const hslToHex = (hslString: string): string => {
    try {
      const match = hslString.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
      if (!match) return '#000000';

      const h = parseFloat(match[1]);
      const s = parseFloat(match[2]) / 100;
      const l = parseFloat(match[3]) / 100;

      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = l - c / 2;

      let r = 0,
        g = 0,
        b = 0;

      if (h >= 0 && h < 60) {
        r = c;
        g = x;
        b = 0;
      } else if (h >= 60 && h < 120) {
        r = x;
        g = c;
        b = 0;
      } else if (h >= 120 && h < 180) {
        r = 0;
        g = c;
        b = x;
      } else if (h >= 180 && h < 240) {
        r = 0;
        g = x;
        b = c;
      } else if (h >= 240 && h < 300) {
        r = x;
        g = 0;
        b = c;
      } else if (h >= 300 && h < 360) {
        r = c;
        g = 0;
        b = x;
      }

      const toHex = (n: number): string => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return '#000000';
    }
  };

  /**
   * Gets theme colors from CSS variables
   */
  const getThemeColors = () => {
    if (typeof window === 'undefined') {
      return {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#528bff',
      };
    }

    const style = getComputedStyle(document.documentElement);
    const panelHsl = style.getPropertyValue('--cf-panel');
    const foregroundHsl = style.getPropertyValue('--foreground');
    const primaryHsl = style.getPropertyValue('--primary');

    return {
      background: hslToHex(panelHsl) || '#1e1e1e',
      foreground: hslToHex(foregroundHsl) || '#d4d4d4',
      cursor: hslToHex(primaryHsl) || '#528bff',
    };
  };

  /**
   * Writes the prompt to the terminal
   */
  const writePrompt = () => {
    const term = terminalRef.current;
    if (!term) return;

    const prompt = `${COLORS.green}${COLORS.bold}codeforge${COLORS.reset}${COLORS.cyan}:${currentDirectoryRef.current}${COLORS.reset}$ `;
    term.write(prompt);
  };

  /**
   * Handles command execution
   */
  const executeCommand = (command: string) => {
    const term = terminalRef.current;
    if (!term) return;

    const trimmedCommand = command.trim();
    if (!trimmedCommand) {
      term.write('\r\n');
      writePrompt();
      return;
    }

    // Add to history
    commandHistoryRef.current.push(trimmedCommand);
    if (commandHistoryRef.current.length > 50) {
      commandHistoryRef.current.shift();
    }
    historyIndexRef.current = commandHistoryRef.current.length;

    term.write('\r\n');

    // Parse command and arguments
    const parts = trimmedCommand.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    // Execute command
    switch (cmd) {
      case 'help':
        term.write(
          `${COLORS.bold}Available commands:${COLORS.reset}\r\n` +
            `  ${COLORS.cyan}help${COLORS.reset}          Show this help message\r\n` +
            `  ${COLORS.cyan}clear / cls${COLORS.reset}   Clear terminal\r\n` +
            `  ${COLORS.cyan}echo <text>${COLORS.reset}   Print text\r\n` +
            `  ${COLORS.cyan}date${COLORS.reset}          Show current date/time\r\n` +
            `  ${COLORS.cyan}whoami${COLORS.reset}        Show current user\r\n` +
            `  ${COLORS.cyan}pwd${COLORS.reset}           Print working directory\r\n` +
            `  ${COLORS.cyan}ls${COLORS.reset}            List files\r\n` +
            `  ${COLORS.cyan}cd <dir>${COLORS.reset}      Change directory\r\n` +
            `  ${COLORS.cyan}cat <file>${COLORS.reset}    Display file contents\r\n` +
            `  ${COLORS.cyan}mkdir <name>${COLORS.reset}  Create directory\r\n` +
            `  ${COLORS.cyan}touch <name>${COLORS.reset}  Create file\r\n` +
            `  ${COLORS.cyan}rm <name>${COLORS.reset}     Remove file or empty directory\r\n` +
            `  ${COLORS.cyan}history${COLORS.reset}       Show command history\r\n` +
            `  ${COLORS.cyan}git status${COLORS.reset}    Show git status\r\n` +
            `  ${COLORS.cyan}git branch${COLORS.reset}    Show current branch\r\n`
        );
        break;

      case 'clear':
      case 'cls':
        term.clear();
        break;

      case 'echo':
        term.write(args.join(' ') + '\r\n');
        break;

      case 'date':
        term.write(new Date().toString() + '\r\n');
        break;

      case 'whoami':
        term.write('codeforge-user\r\n');
        break;

      case 'pwd':
        term.write(currentDirectoryRef.current + '\r\n');
        break;

      case 'ls':
        handleLs();
        break;

      case 'cd':
        handleCd(args[0]);
        break;

      case 'cat':
        handleCat(args[0]);
        break;

      case 'mkdir':
        handleMkdir(args[0]);
        break;

      case 'touch':
        handleTouch(args[0]);
        break;

      case 'rm':
        handleRm(args[0]);
        break;

      case 'history':
        handleHistory();
        break;

      case 'git':
        handleGit(args);
        break;

      default:
        term.write(
          `${COLORS.red}command not found: ${cmd}${COLORS.reset}\r\n`
        );
        break;
    }

    if (cmd !== 'clear' && cmd !== 'cls') {
      writePrompt();
    }
  };

  /**
   * Handles 'ls' command
   */
  const handleLs = () => {
    const term = terminalRef.current;
    if (!term) return;

    const currentDir = fileSystemRef.current[currentDirectoryRef.current];
    if (!currentDir || currentDir.type !== 'directory') {
      term.write(`${COLORS.red}Not a directory${COLORS.reset}\r\n`);
      return;
    }

    const children = currentDir.children || [];
    children.forEach((child) => {
      const childPath = `${currentDirectoryRef.current}/${child}`;
      const childNode = fileSystemRef.current[childPath];
      const color =
        childNode?.type === 'directory' ? COLORS.blue : COLORS.reset;
      term.write(`${color}${child}${COLORS.reset}  `);
    });
    term.write('\r\n');
  };

  /**
   * Handles 'cd' command
   */
  const handleCd = (dir: string) => {
    const term = terminalRef.current;
    if (!term) return;

    if (!dir) {
      currentDirectoryRef.current = '/workspace';
      return;
    }

    if (dir === '.') {
      return;
    }

    if (dir === '..') {
      const parts = currentDirectoryRef.current.split('/');
      if (parts.length > 2) {
        parts.pop();
        currentDirectoryRef.current = parts.join('/') || '/';
      }
      return;
    }

    const newPath = dir.startsWith('/')
      ? dir
      : `${currentDirectoryRef.current}/${dir}`;

    const targetDir = fileSystemRef.current[newPath];
    if (!targetDir) {
      term.write(
        `${COLORS.red}cd: ${dir}: No such file or directory${COLORS.reset}\r\n`
      );
      return;
    }

    if (targetDir.type !== 'directory') {
      term.write(
        `${COLORS.red}cd: ${dir}: Not a directory${COLORS.reset}\r\n`
      );
      return;
    }

    currentDirectoryRef.current = newPath;
  };

  /**
   * Handles 'cat' command
   */
  const handleCat = (filename: string) => {
    const term = terminalRef.current;
    if (!term) return;

    if (!filename) {
      term.write(`${COLORS.red}cat: missing file operand${COLORS.reset}\r\n`);
      return;
    }

    const filePath = filename.startsWith('/')
      ? filename
      : `${currentDirectoryRef.current}/${filename}`;

    const file = fileSystemRef.current[filePath];
    if (!file) {
      term.write(
        `${COLORS.red}cat: ${filename}: No such file or directory${COLORS.reset}\r\n`
      );
      return;
    }

    if (file.type !== 'file') {
      term.write(
        `${COLORS.red}cat: ${filename}: Is a directory${COLORS.reset}\r\n`
      );
      return;
    }

    term.write((file.content || '') + '\r\n');
  };

  /**
   * Handles 'mkdir' command
   */
  const handleMkdir = (dirname: string) => {
    const term = terminalRef.current;
    if (!term) return;

    if (!dirname) {
      term.write(
        `${COLORS.red}mkdir: missing operand${COLORS.reset}\r\n`
      );
      return;
    }

    const newPath = dirname.startsWith('/')
      ? dirname
      : `${currentDirectoryRef.current}/${dirname}`;

    if (fileSystemRef.current[newPath]) {
      term.write(
        `${COLORS.red}mkdir: ${dirname}: File exists${COLORS.reset}\r\n`
      );
      return;
    }

    fileSystemRef.current[newPath] = {
      type: 'directory',
      children: [],
    };

    // Add to parent directory
    const currentDir = fileSystemRef.current[currentDirectoryRef.current];
    if (currentDir && currentDir.children) {
      currentDir.children.push(dirname);
    }

    term.write(`${COLORS.green}Created directory: ${dirname}${COLORS.reset}\r\n`);
  };

  /**
   * Handles 'touch' command
   */
  const handleTouch = (filename: string) => {
    const term = terminalRef.current;
    if (!term) return;

    if (!filename) {
      term.write(
        `${COLORS.red}touch: missing file operand${COLORS.reset}\r\n`
      );
      return;
    }

    const newPath = filename.startsWith('/')
      ? filename
      : `${currentDirectoryRef.current}/${filename}`;

    if (fileSystemRef.current[newPath]) {
      term.write(
        `${COLORS.yellow}touch: ${filename}: File exists${COLORS.reset}\r\n`
      );
      return;
    }

    fileSystemRef.current[newPath] = {
      type: 'file',
      content: '',
    };

    // Add to parent directory
    const currentDir = fileSystemRef.current[currentDirectoryRef.current];
    if (currentDir && currentDir.children) {
      currentDir.children.push(filename);
    }

    term.write(`${COLORS.green}Created file: ${filename}${COLORS.reset}\r\n`);
  };

  /**
   * Handles 'rm' command — removes a file or empty directory
   */
  const handleRm = (target: string) => {
    const term = terminalRef.current;
    if (!term) return;

    if (!target) {
      term.write(`${COLORS.red}rm: missing operand${COLORS.reset}\r\n`);
      return;
    }

    const targetPath = target.startsWith('/')
      ? target
      : `${currentDirectoryRef.current}/${target}`;

    const node = fileSystemRef.current[targetPath];
    if (!node) {
      term.write(`${COLORS.red}rm: ${target}: No such file or directory${COLORS.reset}\r\n`);
      return;
    }

    if (node.type === 'directory' && node.children && node.children.length > 0) {
      term.write(`${COLORS.red}rm: ${target}: Is a non-empty directory (use rm -r)${COLORS.reset}\r\n`);
      return;
    }

    // Remove from file system
    delete fileSystemRef.current[targetPath];

    // Remove from parent directory children
    const parentDir = fileSystemRef.current[currentDirectoryRef.current];
    if (parentDir && parentDir.children) {
      parentDir.children = parentDir.children.filter((child) => child !== target);
    }

    term.write(`${COLORS.green}Removed: ${target}${COLORS.reset}\r\n`);
  };

  /**
   * Handles 'history' command — shows command history
   */
  const handleHistory = () => {
    const term = terminalRef.current;
    if (!term) return;

    const history = commandHistoryRef.current;
    if (history.length === 0) {
      term.write(`${COLORS.gray}No commands in history${COLORS.reset}\r\n`);
      return;
    }

    history.forEach((cmd, index) => {
      const lineNum = String(index + 1).padStart(4, ' ');
      term.write(`${COLORS.gray}${lineNum}${COLORS.reset}  ${cmd}\r\n`);
    });
  };

  /**
   * Handles 'git' commands
   */
  const handleGit = (args: string[]) => {
    const term = terminalRef.current;
    if (!term) return;

    if (args.length === 0) {
      term.write(
        `${COLORS.yellow}usage: git <command> [<args>]${COLORS.reset}\r\n`
      );
      return;
    }

    const subCommand = args[0];

    switch (subCommand) {
      case 'status':
        handleGitStatus();
        break;

      case 'branch':
        handleGitBranch();
        break;

      default:
        term.write(
          `${COLORS.red}git: '${subCommand}' is not a git command${COLORS.reset}\r\n`
        );
        break;
    }
  };

  /**
   * Handles 'git status' command
   */
  const handleGitStatus = () => {
    const term = terminalRef.current;
    if (!term) return;

    const { currentRepo, currentBranch, status } = useGitStore.getState();

    if (!currentRepo) {
      term.write(
        `${COLORS.red}fatal: not a git repository${COLORS.reset}\r\n`
      );
      return;
    }

    term.write(
      `${COLORS.bold}On branch: ${COLORS.cyan}${currentBranch}${COLORS.reset}\r\n`
    );

    const totalChanges =
      status.modified.length + status.added.length + status.deleted.length;

    if (totalChanges === 0) {
      term.write(`${COLORS.gray}No changes${COLORS.reset}\r\n`);
    } else {
      term.write(`${COLORS.bold}Changes:${COLORS.reset}\r\n`);
      term.write(
        `  ${COLORS.yellow}modified: ${status.modified.length} files${COLORS.reset}\r\n`
      );
      term.write(
        `  ${COLORS.green}added: ${status.added.length} files${COLORS.reset}\r\n`
      );
      term.write(
        `  ${COLORS.red}deleted: ${status.deleted.length} files${COLORS.reset}\r\n`
      );
    }
  };

  /**
   * Handles 'git branch' command
   */
  const handleGitBranch = () => {
    const term = terminalRef.current;
    if (!term) return;

    const { currentRepo, currentBranch, branches } = useGitStore.getState();

    if (!currentRepo) {
      term.write(
        `${COLORS.red}fatal: not a git repository${COLORS.reset}\r\n`
      );
      return;
    }

    if (branches.length === 0) {
      term.write(`${COLORS.gray}No branches${COLORS.reset}\r\n`);
      return;
    }

    branches.forEach((branch) => {
      const isActive = branch.name === currentBranch;
      const prefix = isActive ? '* ' : '  ';
      const color = isActive ? COLORS.green : COLORS.reset;
      term.write(`${color}${prefix}${branch.name}${COLORS.reset}\r\n`);
    });
  };

  /**
   * Handles key input
   */
  const handleKeyInput = (key: string, ev: KeyboardEvent) => {
    const term = terminalRef.current;
    if (!term) return;

    const isPrintable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

    // Handle Ctrl+C
    if (ev.ctrlKey && ev.key === 'c') {
      term.write('^C\r\n');
      currentLineRef.current = '';
      cursorPositionRef.current = 0;
      writePrompt();
      return;
    }

    // Handle Ctrl+L
    if (ev.ctrlKey && ev.key === 'l') {
      term.clear();
      writePrompt();
      return;
    }

    // Handle Enter
    if (ev.key === 'Enter') {
      executeCommand(currentLineRef.current);
      currentLineRef.current = '';
      cursorPositionRef.current = 0;
      return;
    }

    // Handle Backspace
    if (ev.key === 'Backspace') {
      if (cursorPositionRef.current > 0) {
        currentLineRef.current =
          currentLineRef.current.slice(0, cursorPositionRef.current - 1) +
          currentLineRef.current.slice(cursorPositionRef.current);
        cursorPositionRef.current--;
        term.write('\b \b');
      }
      return;
    }

    // Handle Arrow Up (previous command)
    if (ev.key === 'ArrowUp') {
      if (historyIndexRef.current > 0) {
        historyIndexRef.current--;
        const historicCommand =
          commandHistoryRef.current[historyIndexRef.current];
        // Clear current line
        term.write('\r\x1b[K');
        writePrompt();
        term.write(historicCommand);
        currentLineRef.current = historicCommand;
        cursorPositionRef.current = historicCommand.length;
      }
      return;
    }

    // Handle Arrow Down (next command)
    if (ev.key === 'ArrowDown') {
      if (historyIndexRef.current < commandHistoryRef.current.length) {
        historyIndexRef.current++;
        const historicCommand =
          historyIndexRef.current === commandHistoryRef.current.length
            ? ''
            : commandHistoryRef.current[historyIndexRef.current];
        // Clear current line
        term.write('\r\x1b[K');
        writePrompt();
        term.write(historicCommand);
        currentLineRef.current = historicCommand;
        cursorPositionRef.current = historicCommand.length;
      }
      return;
    }

    // Handle printable characters
    if (isPrintable && key.length === 1) {
      currentLineRef.current =
        currentLineRef.current.slice(0, cursorPositionRef.current) +
        key +
        currentLineRef.current.slice(cursorPositionRef.current);
      cursorPositionRef.current++;
      term.write(key);
    }
  };

  /**
   * Initializes the terminal
   */
  useEffect(() => {
    if (!containerRef.current || !isVisible) return;

    let mounted = true;

    const initTerminal = async () => {
      try {
        // Import xterm CSS
        await import('@xterm/xterm/css/xterm.css');

        // Dynamic import to avoid SSR issues
        const [{ Terminal }, { FitAddon }, { WebLinksAddon }] =
          await Promise.all([
            import('@xterm/xterm'),
            import('@xterm/addon-fit'),
            import('@xterm/addon-web-links'),
          ]);

        if (!mounted || !containerRef.current) return;

        const colors = getThemeColors();

        // Create terminal instance
        const terminal = new Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'monospace',
          theme: {
            background: colors.background,
            foreground: colors.foreground,
            cursor: colors.cursor,
          },
          scrollback: 1000,
        });

        // Add fit addon
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);

        // Add web links addon
        const webLinksAddon = new WebLinksAddon();
        terminal.loadAddon(webLinksAddon);

        // Open terminal
        terminal.open(containerRef.current);
        fitAddon.fit();

        // Store references
        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;

        // Handle key input
        terminal.onData((data) => {
          // This is for paste events
          if (data.length > 1) {
            currentLineRef.current += data;
            cursorPositionRef.current += data.length;
            terminal.write(data);
          }
        });

        terminal.onKey(({ key, domEvent }) => {
          handleKeyInput(key, domEvent);
        });

        // Write welcome message
        terminal.writeln(
          `${COLORS.bold}${COLORS.cyan}CodeForge Terminal${COLORS.reset}`
        );
        terminal.writeln(
          `${COLORS.gray}Type 'help' for available commands${COLORS.reset}`
        );
        terminal.writeln('');
        writePrompt();

        // Setup resize observer
        const resizeObserver = new ResizeObserver(() => {
          if (fitAddonRef.current) {
            fitAddonRef.current.fit();
          }
        });
        resizeObserver.observe(containerRef.current);
        resizeObserverRef.current = resizeObserver;
      } catch (error) {
        console.error('Failed to initialize terminal:', error);
      }
    };

    initTerminal();

    // Cleanup
    return () => {
      mounted = false;
      if (resizeObserverRef.current && containerRef.current) {
        resizeObserverRef.current.unobserve(containerRef.current);
        resizeObserverRef.current.disconnect();
      }
      if (terminalRef.current) {
        terminalRef.current.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, isVisible]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ display: isVisible ? 'block' : 'none' }}
    />
  );
}
