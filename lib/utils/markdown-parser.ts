/**
 * CodeForge IDE — Markdown Parser (Zero-dependency)
 * Lightweight tokenizer for AI agent responses.
 * Handles: headings, code blocks, inline code, bold, italic,
 * strikethrough, links, blockquotes, lists, HR, task lists.
 */

export type TokenType =
  | 'heading'
  | 'code_block'
  | 'blockquote'
  | 'unordered_list'
  | 'ordered_list'
  | 'task_list'
  | 'hr'
  | 'paragraph';

export interface MarkdownToken {
  type: TokenType;
  content: string;
  level?: number;       // heading level 1-6
  language?: string;    // code block language
  items?: ListItem[];   // list items
}

export interface ListItem {
  content: string;
  checked?: boolean;    // for task lists
}

/**
 * Tokenize markdown text into block-level tokens.
 */
export function parseMarkdown(text: string): MarkdownToken[] {
  if (!text) return [];

  const tokens: MarkdownToken[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Code block (``` ... ```)
    const codeMatch = line.match(/^\s*```(\w*)\s*$/);
    if (codeMatch) {
      const lang = codeMatch[1] || '';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].match(/^\s*```\s*$/)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      tokens.push({ type: 'code_block', content: codeLines.join('\n'), language: lang });
      continue;
    }

    // ── Horizontal rule
    if (/^\s*([-*_])\s*\1\s*\1(\s*\1)*\s*$/.test(line)) {
      tokens.push({ type: 'hr', content: '' });
      i++;
      continue;
    }

    // ── Heading (# to ######)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      tokens.push({
        type: 'heading',
        content: headingMatch[2].trim(),
        level: headingMatch[1].length,
      });
      i++;
      continue;
    }

    // ── Blockquote (> ...)
    if (line.match(/^\s*>\s?/)) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*>\s?/)) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      tokens.push({ type: 'blockquote', content: quoteLines.join('\n') });
      continue;
    }

    // ── Task list (- [ ] or - [x])
    if (line.match(/^\s*[-*]\s+\[[ xX]\]\s/)) {
      const items: ListItem[] = [];
      while (i < lines.length) {
        const taskMatch = lines[i].match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (!taskMatch) break;
        items.push({
          content: taskMatch[2],
          checked: taskMatch[1].toLowerCase() === 'x',
        });
        i++;
      }
      tokens.push({ type: 'task_list', content: '', items });
      continue;
    }

    // ── Unordered list (- or * or +)
    if (line.match(/^\s*[-*+]\s+/) && !line.match(/^\s*[-*+]\s+\[[ xX]\]/)) {
      const items: ListItem[] = [];
      while (i < lines.length) {
        const ulMatch = lines[i].match(/^\s*[-*+]\s+(.+)$/);
        if (!ulMatch) break;
        items.push({ content: ulMatch[1] });
        i++;
      }
      tokens.push({ type: 'unordered_list', content: '', items });
      continue;
    }

    // ── Ordered list (1. 2. etc)
    if (line.match(/^\s*\d+\.\s+/)) {
      const items: ListItem[] = [];
      while (i < lines.length) {
        const olMatch = lines[i].match(/^\s*\d+\.\s+(.+)$/);
        if (!olMatch) break;
        items.push({ content: olMatch[1] });
        i++;
      }
      tokens.push({ type: 'ordered_list', content: '', items });
      continue;
    }

    // ── Empty line (skip)
    if (line.trim() === '') {
      i++;
      continue;
    }

    // ── Paragraph (collect consecutive non-empty lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^\s*```/) &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].match(/^\s*>/) &&
      !lines[i].match(/^\s*[-*+]\s+/) &&
      !lines[i].match(/^\s*\d+\.\s+/) &&
      !lines[i].match(/^\s*([-*_])\s*\1\s*\1/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      tokens.push({ type: 'paragraph', content: paraLines.join('\n') });
    }
  }

  return tokens;
}

/**
 * Parse inline markdown elements within text.
 * Returns segments with type info for rendering.
 */
export type InlineType = 'text' | 'bold' | 'italic' | 'bold_italic' | 'strikethrough' | 'code' | 'link' | 'image';

export interface InlineSegment {
  type: InlineType;
  content: string;
  href?: string;
  alt?: string;
}

export function parseInline(text: string): InlineSegment[] {
  if (!text) return [];

  const segments: InlineSegment[] = [];
  // Pattern order matters: bold_italic before bold/italic
  const regex = /(!\[([^\]]*)\]\(([^)]+)\))|(\[([^\]]*)\]\(([^)]+)\))|(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)|(~~(.+?)~~)|(`([^`]+)`)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // Image: ![alt](src)
      segments.push({ type: 'image', content: match[3], alt: match[2] });
    } else if (match[4]) {
      // Link: [text](url)
      segments.push({ type: 'link', content: match[5], href: match[6] });
    } else if (match[7]) {
      // Bold italic: ***text***
      segments.push({ type: 'bold_italic', content: match[8] });
    } else if (match[9]) {
      // Bold: **text**
      segments.push({ type: 'bold', content: match[10] });
    } else if (match[11]) {
      // Bold alt: __text__
      segments.push({ type: 'bold', content: match[12] });
    } else if (match[13]) {
      // Italic: *text*
      segments.push({ type: 'italic', content: match[14] });
    } else if (match[15]) {
      // Strikethrough: ~~text~~
      segments.push({ type: 'strikethrough', content: match[16] });
    } else if (match[17]) {
      // Inline code: `code`
      segments.push({ type: 'code', content: match[18] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

/**
 * Clean AI response content — remove tool noise.
 * Strips [Calling tool: ...] lines and raw JSON tool results.
 */
export function cleanAIContent(content: string): string {
  if (!content) return '';

  return content
    // Remove [Calling tool: xxx] lines
    .replace(/^\[Calling tool:.*\]$/gm, '')
    // Remove "Tool xxx result: {...}" lines
    .replace(/^Tool \w+ result:.*$/gm, '')
    // Remove lines that are pure JSON objects (tool results leaked into response)
    .replace(/^\{"success":(true|false).*\}$/gm, '')
    // Clean up multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
