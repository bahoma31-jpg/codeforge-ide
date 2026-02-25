import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#1e1e1e]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#3794ff] border-t-transparent" />
        <p className="text-sm text-[#cccccc]">Loading CodeForge IDE...</p>
      </div>
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="h-full w-full animate-pulse bg-[#1e1e1e] p-4">
      <div className="mb-4 h-6 w-1/4 rounded bg-[#2d2d2d]" />
      <div className="mb-2 h-4 w-full rounded bg-[#2d2d2d]" />
      <div className="mb-2 h-4 w-11/12 rounded bg-[#2d2d2d]" />
      <div className="mb-2 h-4 w-10/12 rounded bg-[#2d2d2d]" />
      <div className="mb-4 h-4 w-full rounded bg-[#2d2d2d]" />
      <div className="mb-2 h-4 w-9/12 rounded bg-[#2d2d2d]" />
      <div className="mb-2 h-4 w-full rounded bg-[#2d2d2d]" />
    </div>
  );
}

export function TerminalSkeleton() {
  return (
    <div className="h-full w-full animate-pulse bg-[#1e1e1e] p-4">
      <div className="mb-2 h-4 w-1/3 rounded bg-[#2d2d2d]" />
      <div className="mb-2 h-4 w-1/4 rounded bg-[#2d2d2d]" />
      <div className="mb-2 h-4 w-1/2 rounded bg-[#2d2d2d]" />
      <div className="mb-2 h-4 w-1/3 rounded bg-[#2d2d2d]" />
    </div>
  );
}
