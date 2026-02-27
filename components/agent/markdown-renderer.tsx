'use client';

/**
 * CodeForge IDE — Markdown Renderer v1.0
 * React component that renders parsed markdown tokens.
 * Catppuccin Mocha themed. Supports copy-to-clipboard for code blocks
 * and clickable file paths.
 */

import React, { useState, useCallback } from 'react';
import { Copy, Check, FileCode2, ExternalLink } from 'lucide-react';
import {
  parseMarkdown,
  parseInline,
  cleanAIContent,
  type MarkdownToken,
  type InlineSegment,
} from '@/lib/utils/markdown-parser';
import { parseFilePathsFromText, type TextSegment } from '@/lib/utils/file-path-detect';
import { useEditorStore } from '@/lib/stores/editor-store';

// ─── Main Renderer ──────────────────────────────────────────

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const cleaned = cleanAIContent(content);
  if (!cleaned) return null;

  const tokens = parseMarkdown(cleaned);

  return (
    <div className="markdown-content space-y-2">
      {tokens.map((token, i) => (
        <TokenRenderer key={i} token={token} />
      ))}
    </div>
  );
}

// ─── Token Renderer ──────────────────────────────────────────

function TokenRenderer({ token }: { token: MarkdownToken }) {
  switch (token.type) {
    case 'heading':
      return <HeadingBlock level={token.level || 1} content={token.content} />;
    case 'code_block':
      return <CodeBlock code={token.content} language={token.language} />;
    case 'blockquote':
      return <BlockquoteBlock content={token.content} />;
    case 'unordered_list':
      return <UnorderedListBlock items={token.items || []} />;
    case 'ordered_list':
      return <OrderedListBlock items={token.items || []} />;
    case 'task_list':
      return <TaskListBlock items={token.items || []} />;
    case 'hr':
      return <hr className="border-[#313244] my-3" />;
    case 'paragraph':
      return <ParagraphBlock content={token.content} />;
    default:
      return <ParagraphBlock content={token.content} />;
  }
}

// ─── Heading ─────────────────────────────────────────────────

function HeadingBlock({ level, content }: { level: number; content: string }) {
  const sizes: Record<number, string> = {
    1: 'text-base font-bold text-[#cdd6f4] mt-3 mb-1',
    2: 'text-sm font-bold text-[#cdd6f4] mt-2.5 mb-1',
    3: 'text-sm font-semibold text-[#bac2de] mt-2 mb-0.5',
    4: 'text-xs font-semibold text-[#bac2de] mt-1.5 mb-0.5',
    5: 'text-xs font-medium text-[#a6adc8] mt-1',
    6: 'text-xs font-medium text-[#a6adc8] mt-1',
  };

  return (
    <div className={sizes[level] || sizes[3]}>
      <InlineContent text={content} />
    </div>
  );
}

// ─── Code Block ──────────────────────────────────────────────

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="rounded-lg border border-[#313244] bg-[#11111b] overflow-hidden my-2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#181825] border-b border-[#313244]">
        <span className="text-[10px] text-[#6c7086] font-mono">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
          title="نسخ"
        >
          {copied ? (
            <>
              <Check size={10} className="text-[#a6e3a1]" />
              <span className="text-[#a6e3a1]">تم النسخ</span>
            </>
          ) : (
            <>
              <Copy size={10} />
              <span>نسخ</span>
            </>
          )}
        </button>
      </div>
      {/* Code */}
      <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed font-mono text-[#cdd6f4]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Blockquote ──────────────────────────────────────────────

function BlockquoteBlock({ content }: { content: string }) {
  return (
    <div className="border-l-2 border-[#89b4fa]/50 pl-3 py-1 my-1.5 text-[#a6adc8]">
      <InlineContent text={content} />
    </div>
  );
}

// ─── Lists ───────────────────────────────────────────────────

function UnorderedListBlock({ items }: { items: { content: string }[] }) {
  return (
    <ul className="space-y-0.5 my-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-1.5 text-sm">
          <span className="text-[#89b4fa] mt-1.5 text-[8px]">●</span>
          <span className="flex-1">
            <InlineContent text={item.content} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function OrderedListBlock({ items }: { items: { content: string }[] }) {
  return (
    <ol className="space-y-0.5 my-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-1.5 text-sm">
          <span className="text-[#89b4fa] font-mono text-[11px] min-w-[1.2em] text-right mt-0.5">
            {i + 1}.
          </span>
          <span className="flex-1">
            <InlineContent text={item.content} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function TaskListBlock({ items }: { items: { content: string; checked?: boolean }[] }) {
  return (
    <ul className="space-y-0.5 my-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-1.5 text-sm">
          <span className="mt-0.5">
            {item.checked ? (
              <span className="text-[#a6e3a1]">☑</span>
            ) : (
              <span className="text-[#6c7086]">☐</span>
            )}
          </span>
          <span className={`flex-1 ${item.checked ? 'line-through text-[#6c7086]' : ''}`}>
            <InlineContent text={item.content} />
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─── Paragraph ───────────────────────────────────────────────

function ParagraphBlock({ content }: { content: string }) {
  return (
    <p className="text-sm leading-relaxed">
      <InlineContent text={content} />
    </p>
  );
}

// ─── Inline Content Renderer ─────────────────────────────────

function InlineContent({ text }: { text: string }) {
  const segments = parseInline(text);

  return (
    <>
      {segments.map((seg, i) => (
        <InlineSegmentRenderer key={i} segment={seg} />
      ))}
    </>
  );
}

function InlineSegmentRenderer({ segment }: { segment: InlineSegment }) {
  switch (segment.type) {
    case 'bold':
      return <strong className="font-semibold text-[#cdd6f4]">{segment.content}</strong>;

    case 'italic':
      return <em className="italic text-[#bac2de]">{segment.content}</em>;

    case 'bold_italic':
      return <strong className="font-semibold italic text-[#cdd6f4]">{segment.content}</strong>;

    case 'strikethrough':
      return <del className="text-[#6c7086]">{segment.content}</del>;

    case 'code':
      return <InlineCode code={segment.content} />;

    case 'link':
      return (
        <a
          href={segment.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[#89b4fa] hover:underline"
        >
          {segment.content}
          <ExternalLink size={10} className="opacity-50" />
        </a>
      );

    case 'image':
      return (
        <span className="block my-2">
          <img
            src={segment.content}
            alt={segment.alt || ''}
            className="max-w-full rounded-md border border-[#313244]"
            loading="lazy"
          />
        </span>
      );

    case 'text':
    default:
      return <TextWithFilePaths text={segment.content} />;
  }
}

// ─── Inline Code (with file path detection) ──────────────────

function InlineCode({ code }: { code: string }) {
  const segments = parseFilePathsFromText(code);
  const isFilePath =
    segments.length === 1 &&
    segments[0].type === 'filepath' &&
    segments[0].filePath;

  if (isFilePath && segments[0].filePath) {
    return (
      <FilePathLink
        filePath={segments[0].filePath}
        language={segments[0].language || 'plaintext'}
        displayText={code}
        isInlineCode
      />
    );
  }

  return (
    <code className="px-1.5 py-0.5 rounded bg-[#181825] text-[#f9e2af] text-[11px] font-mono border border-[#313244]/50">
      {code}
    </code>
  );
}

// ─── File Path Detection in Plain Text ───────────────────────

function TextWithFilePaths({ text }: { text: string }) {
  if (!text) return null;

  const segments = parseFilePathsFromText(text);
  if (segments.every((s) => s.type === 'text')) {
    return <span>{text}</span>;
  }

  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === 'filepath' && segment.filePath) {
          return (
            <FilePathLink
              key={i}
              filePath={segment.filePath}
              language={segment.language || 'plaintext'}
              displayText={segment.value}
              isInlineCode={false}
            />
          );
        }
        return <span key={i}>{segment.value}</span>;
      })}
    </>
  );
}

// ─── Clickable File Path ─────────────────────────────────────

function FilePathLink({
  filePath,
  language,
  displayText,
  isInlineCode,
}: {
  filePath: string;
  language: string;
  displayText: string;
  isInlineCode: boolean;
}) {
  const openFileFromPath = useEditorStore((s) => s.openFileFromPath);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await openFileFromPath(filePath, language);
    } catch (error) {
      console.error('[MarkdownRenderer] Failed to open:', filePath, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={`فتح ${filePath}`}
      className={`inline-flex items-center gap-0.5 rounded transition-all cursor-pointer
        ${isInlineCode
          ? 'px-1.5 py-0.5 bg-[#181825] text-[11px] font-mono border border-[#313244]/50 hover:border-[#89b4fa]/40 hover:bg-[#89b4fa]/10 hover:text-[#89b4fa]'
          : 'text-[#89b4fa] hover:underline text-sm'
        }
        ${loading ? 'opacity-50' : ''}
      `}
    >
      <FileCode2 size={10} className="shrink-0" />
      <span>{displayText}</span>
    </button>
  );
}
