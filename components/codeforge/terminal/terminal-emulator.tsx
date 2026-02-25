'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTerminalStore } from '@/lib/stores/terminal-store';
import { useGitStore } from '@/lib/stores/git-store';
import '@xterm/xterm/css/xterm.css';

type TerminalEmulatorProps = {
  terminalId: string;
};

/**
 * Terminal Emulator Component
 * Full-featured terminal with xterm.js and simulated shell
 */
export default function TerminalEmulator({ terminalId }: TerminalEmulatorProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  const { updateTerminalCwd, addToHistory, getActiveTerminal } = useTerminalStore();
  const { status, commitChanges, pushToGitHub, pullFromGitHub } = useGitStore();
  
  const [currentLine, setCurrentLine] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cwd, setCwd] = useState('/');

  /**
   * Get current working directory display
   */
  const getPrompt = (): string => {
    return `\x1b[32muser@codeforge\x1b[0m:\x1b[34m${cwd}\x1b[0m$ `;
  };

  /**
   * Execute a shell command
   * @param command - Command string to execute
   */
  const executeCommand = (command: string): void => {
    const term = xtermRef.current;
    if (!term) return;

    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    // Add to history
    addToHistory(terminalId, command);

    term.writeln('');

    switch (cmd) {
      // File navigation commands
      case 'ls':
        handleLs(args[0] || cwd);
        break;

      case 'cd':
        handleCd(args[0] || '/');
        break;

      case 'pwd':
        term.writeln(cwd);
        break;

      case 'cat':
        if (args[0]) {
          handleCat(args[0]);
        } else {
          term.writeln('\x1b[31mcat: missing file operand\x1b[0m');
        }
        break;

      case 'mkdir':
        if (args[0]) {
          handleMkdir(args[0]);
        } else {
          term.writeln('\x1b[31mmkdir: missing operand\x1b[0m');
        }
        break;

      case 'touch':
        if (args[0]) {
          handleTouch(args[0]);
        } else {
          term.writeln('\x1b[31mtouch: missing file operand\x1b[0m');
        }
        break;

      case 'rm':
        if (args[0]) {
          handleRm(args[0]);
        } else {
          term.writeln('\x1b[31mrm: missing operand\x1b[0m');
        }
        break;

      // Git commands
      case 'git':
        handleGit(args);
        break;

      // Utility commands
      case 'clear':
        term.clear();
        break;

      case 'echo':
        term.writeln(args.join(' '));
        break;

      case 'help':
        showHelp();
        break;

      case 'exit':
        term.writeln('\x1b[33mUse the close button to exit terminal\x1b[0m');
        break;

      case '':
        // Empty command
        break;

      default:
        term.writeln(`\x1b[31mbash: ${cmd}: command not found\x1b[0m`);
        term.writeln('Type \x1b[36mhelp\x1b[0m for available commands');
    }

    term.write(getPrompt());
  };

  /**
   * Handle ls command
   */
  const handleLs = (path: string): void => {
    const term = xtermRef.current;
    if (!term) return;

    // Simulated file structure
    const files = [
      { name: 'src', type: 'dir', color: '\x1b[34m' },
      { name: 'public', type: 'dir', color: '\x1b[34m' },
      { name: 'package.json', type: 'file', color: '\x1b[0m' },
      { name: 'README.md', type: 'file', color: '\x1b[0m' },
      { name: 'tsconfig.json', type: 'file', color: '\x1b[0m' },
      { name: '.gitignore', type: 'file', color: '\x1b[90m' },
    ];

    files.forEach((file) => {
      term.writeln(`${file.color}${file.name}${file.type === 'dir' ? '/' : ''}\x1b[0m`);
    });
  };

  /**
   * Handle cd command
   */
  const handleCd = (path: string): void => {
    const term = xtermRef.current;
    if (!term) return;

    // Normalize path
    let newCwd = path;
    if (path === '..' || path === '../') {
      const parts = cwd.split('/').filter(Boolean);
      parts.pop();
      newCwd = '/' + parts.join('/');
    } else if (path === '~' || path === '') {
      newCwd = '/';
    } else if (!path.startsWith('/')) {
      newCwd = cwd === '/' ? `/${path}` : `${cwd}/${path}`;
    }

    // Validate directory exists (simplified)
    const validDirs = ['/', '/src', '/public', '/components', '/lib'];
    if (validDirs.includes(newCwd) || newCwd.startsWith('/src/') || newCwd.startsWith('/components/')) {
      setCwd(newCwd);
      updateTerminalCwd(terminalId, newCwd);
    } else {
      term.writeln(`\x1b[31mbash: cd: ${path}: No such file or directory\x1b[0m`);
    }
  };

  /**
   * Handle cat command
   */
  const handleCat = (filename: string): void => {
    const term = xtermRef.current;
    if (!term) return;

    // Simulated file contents
    const files: Record<string, string> = {
      'README.md': '# CodeForge IDE\n\nA modern web-based code editor.',
      'package.json': '{\n  "name": "codeforge-ide",\n  "version": "0.1.0"\n}',
      '.gitignore': 'node_modules/\n.next/\n.env.local',
    };

    if (files[filename]) {
      term.writeln(files[filename]);
    } else {
      term.writeln(`\x1b[31mcat: ${filename}: No such file or directory\x1b[0m`);
    }
  };

  /**
   * Handle mkdir command
   */
  const handleMkdir = (dirname: string): void => {
    const term = xtermRef.current;
    if (!term) return;
    term.writeln(`\x1b[32mCreated directory: ${dirname}\x1b[0m`);
  };

  /**
   * Handle touch command
   */
  const handleTouch = (filename: string): void => {
    const term = xtermRef.current;
    if (!term) return;
    term.writeln(`\x1b[32mCreated file: ${filename}\x1b[0m`);
  };

  /**
   * Handle rm command
   */
  const handleRm = (filename: string): void => {
    const term = xtermRef.current;
    if (!term) return;
    term.writeln(`\x1b[33mRemoved: ${filename}\x1b[0m`);
  };

  /**
   * Handle git commands
   */
  const handleGit = (args: string[]): void => {
    const term = xtermRef.current;
    if (!term) return;

    const subcommand = args[0];

    switch (subcommand) {
      case 'status':
        term.writeln('On branch main');
        if (status.modified.length + status.added.length + status.deleted.length === 0) {
          term.writeln('\x1b[32mnothing to commit, working tree clean\x1b[0m');
        } else {
          term.writeln('');
          term.writeln('Changes not staged for commit:');
          status.modified.forEach((file) => {
            term.writeln(`\x1b[31m  modified:   ${file}\x1b[0m`);
          });
          status.added.forEach((file) => {
            term.writeln(`\x1b[32m  new file:   ${file}\x1b[0m`);
          });
          status.deleted.forEach((file) => {
            term.writeln(`\x1b[31m  deleted:    ${file}\x1b[0m`);
          });
        }
        break;

      case 'add':
        if (args[1]) {
          term.writeln(`\x1b[32mAdded ${args[1]} to staging area\x1b[0m`);
        } else {
          term.writeln('\x1b[31mNothing specified, nothing added.\x1b[0m');
        }
        break;

      case 'commit':
        if (args[1] === '-m' && args[2]) {
          const message = args.slice(2).join(' ').replace(/["']/g, '');
          commitChanges(message)
            .then(() => {
              term.writeln(`\x1b[32m[main ${Date.now().toString(16).slice(-7)}] ${message}\x1b[0m`);
              term.writeln('1 file changed, 1 insertion(+)');
            })
            .catch((err) => {
              term.writeln(`\x1b[31mCommit failed: ${err.message}\x1b[0m`);
            });
        } else {
          term.writeln('\x1b[31mUsage: git commit -m "message"\x1b[0m');
        }
        break;

      case 'push':
        term.writeln('Pushing to origin...');
        pushToGitHub()
          .then(() => {
            term.writeln('\x1b[32mPush successful!\x1b[0m');
          })
          .catch((err) => {
            term.writeln(`\x1b[31mPush failed: ${err.message}\x1b[0m`);
          });
        break;

      case 'pull':
        term.writeln('Pulling from origin...');
        pullFromGitHub()
          .then(() => {
            term.writeln('\x1b[32mPull successful!\x1b[0m');
          })
          .catch((err) => {
            term.writeln(`\x1b[31mPull failed: ${err.message}\x1b[0m`);
          });
        break;

      case 'log':
        term.writeln('\x1b[33mcommit abc123def456 (HEAD -> main)\x1b[0m');
        term.writeln('Author: User <user@example.com>');
        term.writeln('Date:   ' + new Date().toUTCString());
        term.writeln('');
        term.writeln('    Initial commit');
        break;

      case 'branch':
        term.writeln('* \x1b[32mmain\x1b[0m');
        term.writeln('  develop');
        break;

      default:
        term.writeln(`\x1b[31mgit: '${subcommand}' is not a git command. See 'git --help'.\x1b[0m`);
    }
  };

  /**
   * Show help with available commands
   */
  const showHelp = (): void => {
    const term = xtermRef.current;
    if (!term) return;

    term.writeln('\x1b[1;36mAvailable Commands:\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[1mFile Navigation:\x1b[0m');
    term.writeln('  ls [path]           - List directory contents');
    term.writeln('  cd <path>           - Change directory');
    term.writeln('  pwd                 - Print working directory');
    term.writeln('  cat <file>          - Display file contents');
    term.writeln('  mkdir <dir>         - Create directory');
    term.writeln('  touch <file>        - Create empty file');
    term.writeln('  rm <file>           - Remove file');
    term.writeln('');
    term.writeln('\x1b[1mGit Commands:\x1b[0m');
    term.writeln('  git status          - Show working tree status');
    term.writeln('  git add <file>      - Add file to staging');
    term.writeln('  git commit -m "msg" - Commit changes');
    term.writeln('  git push            - Push to remote');
    term.writeln('  git pull            - Pull from remote');
    term.writeln('  git log             - Show commit logs');
    term.writeln('  git branch          - List branches');
    term.writeln('');
    term.writeln('\x1b[1mUtilities:\x1b[0m');
    term.writeln('  clear               - Clear terminal');
    term.writeln('  echo <text>         - Print text');
    term.writeln('  help                - Show this help');
    term.writeln('  exit                - Exit terminal');
    term.writeln('');
  };

  /**
   * Handle key press in terminal
   */
  const handleData = (data: string): void => {
    const term = xtermRef.current;
    if (!term) return;

    const terminal = getActiveTerminal();
    if (!terminal) return;

    // Handle special keys
    const code = data.charCodeAt(0);

    // Enter key
    if (code === 13) {
      executeCommand(currentLine);
      setCurrentLine('');
      setHistoryIndex(-1);
      return;
    }

    // Backspace
    if (code === 127) {
      if (currentLine.length > 0) {
        setCurrentLine((prev) => prev.slice(0, -1));
        term.write('\b \b');
      }
      return;
    }

    // Ctrl+C
    if (code === 3) {
      term.write('^C\r\n');
      term.write(getPrompt());
      setCurrentLine('');
      return;
    }

    // Ctrl+L (clear)
    if (code === 12) {
      term.clear();
      term.write(getPrompt());
      setCurrentLine('');
      return;
    }

    // Arrow up (history previous)
    if (data === '\x1b[A') {
      if (terminal.history.length > 0 && historyIndex < terminal.history.length - 1) {
        const newIndex = historyIndex + 1;
        const command = terminal.history[terminal.history.length - 1 - newIndex];
        
        // Clear current line
        term.write('\r\x1b[K');
        term.write(getPrompt());
        term.write(command);
        
        setCurrentLine(command);
        setHistoryIndex(newIndex);
      }
      return;
    }

    // Arrow down (history next)
    if (data === '\x1b[B') {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const command = terminal.history[terminal.history.length - 1 - newIndex];
        
        // Clear current line
        term.write('\r\x1b[K');
        term.write(getPrompt());
        term.write(command);
        
        setCurrentLine(command);
        setHistoryIndex(newIndex);
      } else if (historyIndex === 0) {
        // Clear line
        term.write('\r\x1b[K');
        term.write(getPrompt());
        setCurrentLine('');
        setHistoryIndex(-1);
      }
      return;
    }

    // Tab completion
    if (code === 9) {
      const commands = ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'touch', 'rm', 'git', 'clear', 'echo', 'help', 'exit'];
      const matches = commands.filter((cmd) => cmd.startsWith(currentLine));
      
      if (matches.length === 1) {
        const completion = matches[0].slice(currentLine.length);
        term.write(completion);
        setCurrentLine(matches[0]);
      } else if (matches.length > 1) {
        term.writeln('');
        term.writeln(matches.join('  '));
        term.write(getPrompt());
        term.write(currentLine);
      }
      return;
    }

    // Regular character
    if (code >= 32 && code <= 126) {
      setCurrentLine((prev) => prev + data);
      term.write(data);
    }
  };

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: 'hsl(var(--cf-panel))',
        foreground: 'hsl(var(--foreground))',
        cursor: 'hsl(var(--primary))',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln('\x1b[1;36mWelcome to CodeForge Terminal\x1b[0m');
    term.writeln('Type \x1b[36mhelp\x1b[0m for available commands');
    term.writeln('');
    term.write(getPrompt());

    // Handle input
    term.onData(handleData);

    // Handle resize
    const handleResize = (): void => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [terminalId]);

  // Fit on mount and cwd change
  useEffect(() => {
    const timer = setTimeout(() => {
      fitAddonRef.current?.fit();
    }, 100);
    return () => clearTimeout(timer);
  }, [cwd]);

  return <div ref={terminalRef} className="h-full w-full" />;
}
