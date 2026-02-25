'use client';

import { useState, useRef, useEffect } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { GitBranch, ChevronDown, Plus, Loader2, Check } from 'lucide-react';

export default function BranchSelector() {
  const { currentBranch, branches, switchBranch, createBranch, isLoading } = useGitStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewBranchName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchBranch = async (branchName: string) => {
    if (branchName === currentBranch) {
      setIsOpen(false);
      return;
    }

    try {
      await switchBranch(branchName);
      setIsOpen(false);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;

    try {
      await createBranch(newBranchName.trim());
      setNewBranchName('');
      setIsCreating(false);
      setIsOpen(false);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateBranch();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewBranchName('');
    }
  };

  return (
    <div ref={dropdownRef} className="relative border-b border-border p-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-secondary disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{currentBranch}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-2 right-2 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded border border-border bg-[hsl(var(--cf-sidebar))] shadow-lg">
          {/* Branch list */}
          <div className="py-1">
            {branches.map((branch) => (
              <button
                key={branch.name}
                onClick={() => handleSwitchBranch(branch.name)}
                disabled={isLoading}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-secondary disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${
                      branch.isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {branch.isActive ? '●' : '○'}
                  </span>
                  <span>{branch.name}</span>
                  {branch.isRemote && (
                    <span className="text-xs text-muted-foreground">(remote)</span>
                  )}
                </div>
                {branch.isActive && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>

          {/* Create new branch */}
          <div className="border-t border-border">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-secondary disabled:opacity-50"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>New Branch</span>
              </button>
            ) : (
              <div className="space-y-1 p-2">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Branch name"
                  autoFocus
                  className="w-full rounded border border-border bg-[hsl(var(--cf-editor))] px-2 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleCreateBranch}
                    disabled={!newBranchName.trim() || isLoading}
                    className="flex flex-1 items-center justify-center gap-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Create'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewBranchName('');
                    }}
                    className="rounded bg-secondary px-2 py-1 text-xs hover:bg-secondary/80"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
