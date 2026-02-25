'use client';

import { GitBranch, AlertCircle, CheckCircle } from 'lucide-react';

interface StatusBarProps {
  branch?: string;
  line?: number;
  column?: number;
  language?: string;
  encoding?: string;
  errors?: number;
  warnings?: number;
}

export function StatusBar({
  branch = 'main',
  line = 1,
  column = 1,
  language = 'plaintext',
  encoding = 'UTF-8',
  errors = 0,
  warnings = 0,
}: StatusBarProps) {
  return (
    <footer
      role="contentinfo"
      aria-label="Status bar"
      className="h-6 bg-primary text-primary-foreground flex items-center justify-between px-2 text-xs"
    >
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-1"
          role="status"
          aria-label={`Current branch: ${branch}`}
        >
          <GitBranch className="h-3 w-3" aria-hidden="true" />
          <span>{branch}</span>
        </div>

        {errors > 0 && (
          <button
            className="flex items-center gap-1 hover:opacity-80"
            aria-label={`${errors} error${errors !== 1 ? 's' : ''}. Click to view.`}
          >
            <AlertCircle className="h-3 w-3 text-destructive" aria-hidden="true" />
            <span>{errors}</span>
          </button>
        )}

        {warnings > 0 && (
          <button
            className="flex items-center gap-1 hover:opacity-80"
            aria-label={`${warnings} warning${warnings !== 1 ? 's' : ''}. Click to view.`}
          >
            <AlertCircle className="h-3 w-3 text-yellow-500" aria-hidden="true" />
            <span>{warnings}</span>
          </button>
        )}

        {errors === 0 && warnings === 0 && (
          <div
            className="flex items-center gap-1"
            role="status"
            aria-label="No problems"
          >
            <CheckCircle className="h-3 w-3" aria-hidden="true" />
            <span>No problems</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span
          role="status"
          aria-label={`Line ${line}, Column ${column}`}
        >
          Ln {line}, Col {column}
        </span>
        <span aria-label={`Language: ${language}`}>{language}</span>
        <span aria-label={`Encoding: ${encoding}`}>{encoding}</span>
      </div>
    </footer>
  );
}
