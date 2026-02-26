'use client';

/**
 * CodeForge IDE — Agent Context Menu Hook
 * Provides context menu actions for sending code to the agent.
 * Integrates with the editor's right-click menu.
 */

import { useCallback } from 'react';
import { useAgentStore } from '@/lib/stores/agent-store';

interface ContextMenuAction {
  id: string;
  label: string;
  icon: string;
  action: (selectedCode: string, filePath: string) => void;
}

export function useAgentContextMenu() {
  const { sendMessage, openPanel, isConfigured } = useAgentStore();

  const explainCode = useCallback(
    (code: string, filePath: string) => {
      openPanel();
      const prompt = `اشرح لي هذا الكود من ملف \`${filePath}\`:\n\n\`\`\`\n${code}\n\`\`\``;
      sendMessage(prompt);
    },
    [sendMessage, openPanel]
  );

  const fixCode = useCallback(
    (code: string, filePath: string) => {
      openPanel();
      const prompt = `راجع هذا الكود وأصلح أي أخطاء فيه. الملف: \`${filePath}\`:\n\n\`\`\`\n${code}\n\`\`\``;
      sendMessage(prompt);
    },
    [sendMessage, openPanel]
  );

  const improveCode = useCallback(
    (code: string, filePath: string) => {
      openPanel();
      const prompt = `حسّن هذا الكود واقترح تحسينات. الملف: \`${filePath}\`:\n\n\`\`\`\n${code}\n\`\`\``;
      sendMessage(prompt);
    },
    [sendMessage, openPanel]
  );

  const addTests = useCallback(
    (code: string, filePath: string) => {
      openPanel();
      const prompt = `اكتب اختبارات (tests) لهذا الكود. الملف: \`${filePath}\`:\n\n\`\`\`\n${code}\n\`\`\``;
      sendMessage(prompt);
    },
    [sendMessage, openPanel]
  );

  const addDocumentation = useCallback(
    (code: string, filePath: string) => {
      openPanel();
      const prompt = `أضف توثيق (JSDoc/TSDoc) لهذا الكود. الملف: \`${filePath}\`:\n\n\`\`\`\n${code}\n\`\`\``;
      sendMessage(prompt);
    },
    [sendMessage, openPanel]
  );

  const actions: ContextMenuAction[] = [
    {
      id: 'agent-explain',
      label: '🤖 اشرح الكود',
      icon: 'lightbulb',
      action: explainCode,
    },
    {
      id: 'agent-fix',
      label: '🔧 أصلح الأخطاء',
      icon: 'wrench',
      action: fixCode,
    },
    {
      id: 'agent-improve',
      label: '✨ حسّن الكود',
      icon: 'sparkles',
      action: improveCode,
    },
    {
      id: 'agent-tests',
      label: '🧪 اكتب اختبارات',
      icon: 'flask',
      action: addTests,
    },
    {
      id: 'agent-docs',
      label: '📝 أضف توثيق',
      icon: 'file-text',
      action: addDocumentation,
    },
  ];

  return {
    actions,
    isConfigured,
  };
}
