'use client';

import { useState, useRef, useEffect } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { GitBranch, ChevronDown, Plus, Check } from 'lucide-react';

export default function BranchSelector() {
  const { currentBranch, branches, isLoading, switchBranch, createBranch } = useGitStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (branchName !== currentBranch) {
      await switchBranch(branchName);
    }
    setIsOpen(false);
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    
    const success = await createBranch(newBranchName.trim());
    if (success) {
      setNewBranchName('');
      setIsCreating(false);
      setIsOpen(false);
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
    <div className="relative p-2 border-b border-border" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <GitBranch className="w-4 h-4" />
        <span className="flex-1 text-left truncate">{currentBranch || 'No branch'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-2 right-2 mt-1 bg-[hsl(var(--cf-sidebar))] border border-border rounded shadow-lg z-50 max-h-64 overflow-y-auto">
          {isCreating ? (
            <div className="p-2 space-y-2">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Branch name..."
                autoFocus
                className="w-full px-2 py-1.5 text-sm bg-[hsl(var(--cf-editor))] border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateBranch}
                  disabled={!newBranchName.trim()}
                  className="flex-1 px-2 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewBranchName('');
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-1">
                {branches.map((branch) => (
                  <button
                    key={branch}
                    onClick={() => handleSwitchBranch(branch)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary text-sm text-left"
                  >
                    {branch === currentBranch ? (
                      <Check className="w-3 h-3 text-primary" />
                    ) : (
                      <span className="w-3 h-3 flex items-center justify-center text-muted-foreground">○</span>
                    )}
                    <span className={`flex-1 truncate ${branch === currentBranch ? 'font-medium' : ''}`}>
                      {branch}
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-border p-1">
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Branch</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
