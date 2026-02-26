'use client';

/**
 * CodeForge IDE — Settings Panel v1.0
 * Full settings panel for managing:
 * - GitHub Personal Access Token
 * - AI Model API Keys (Groq, OpenAI, Ollama)
 * - Theme selection
 * - Agent configuration
 *
 * All secrets are stored in localStorage with masked display.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Github,
  Eye,
  EyeOff,
  Save,
  Check,
  AlertCircle,
  Cpu,
  Palette,
  Shield,
  ExternalLink,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, type CodeforgeTheme } from '@/lib/stores/ui-store';

// ─── Storage Keys ─────────────────────────────────────────────
const STORAGE_KEYS = {
  githubToken: 'codeforge-github-token',
  groqApiKey: 'codeforge-groq-api-key',
  openaiApiKey: 'codeforge-openai-api-key',
  ollamaUrl: 'codeforge-ollama-url',
  agentModel: 'codeforge-agent-model',
  agentProvider: 'codeforge-agent-provider',
} as const;

// ─── Types ────────────────────────────────────────────────────
interface SecretFieldProps {
  label: string;
  storageKey: string;
  placeholder: string;
  icon: React.ElementType;
  helpUrl?: string;
  helpText?: string;
  isUrl?: boolean;
}

type SaveStatus = 'idle' | 'saved' | 'error';

// ─── Secret Input Field ──────────────────────────────────────
function SecretField({
  label,
  storageKey,
  placeholder,
  icon: Icon,
  helpUrl,
  helpText,
  isUrl = false,
}: SecretFieldProps) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [hasStored, setHasStored] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setValue(stored);
        setHasStored(true);
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  const handleSave = useCallback(() => {
    try {
      if (value.trim()) {
        localStorage.setItem(storageKey, value.trim());
        setHasStored(true);
        setStatus('saved');
      } else {
        localStorage.removeItem(storageKey);
        setHasStored(false);
        setStatus('saved');
      }
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }, [value, storageKey]);

  const handleClear = useCallback(() => {
    localStorage.removeItem(storageKey);
    setValue('');
    setHasStored(false);
    setStatus('idle');
  }, [storageKey]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
    },
    [handleSave]
  );

  const maskValue = (val: string) => {
    if (!val || val.length < 8) return '••••••••';
    return val.slice(0, 4) + '••••••••' + val.slice(-4);
  };

  return (
    <div className="rounded-lg border border-[#313244] bg-[#181825] p-3">
      {/* Label row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-[#89b4fa]" />
          <span className="text-xs font-medium text-[#cdd6f4]">{label}</span>
          {hasStored && (
            <span className="flex items-center gap-1 text-[10px] text-[#a6e3a1]">
              <Check size={10} />
              محفوظ
            </span>
          )}
        </div>
        {helpUrl && (
          <a
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-[#89b4fa] hover:underline"
          >
            {helpText || 'احصل على مفتاح'}
            <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={visible || isUrl ? 'text' : 'password'}
            value={visible || isUrl ? value : (hasStored && !value ? '' : value)}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={visible ? placeholder : (hasStored ? maskValue(value) : placeholder)}
            className={cn(
              'w-full rounded-md border border-[#313244] bg-[#1e1e2e] px-3 py-1.5',
              'text-xs font-mono text-[#cdd6f4] placeholder:text-[#45475a]',
              'focus:outline-none focus:ring-1 focus:ring-[#89b4fa]',
              'transition-colors'
            )}
            dir="ltr"
          />
          {!isUrl && (
            <button
              onClick={() => setVisible(!visible)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
              title={visible ? 'إخفاء' : 'إظهار'}
            >
              {visible ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={cn(
            'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-colors',
            status === 'saved'
              ? 'bg-[#a6e3a1]/20 text-[#a6e3a1]'
              : status === 'error'
                ? 'bg-[#f38ba8]/20 text-[#f38ba8]'
                : 'bg-[#89b4fa]/20 text-[#89b4fa] hover:bg-[#89b4fa]/30'
          )}
          title="حفظ"
        >
          {status === 'saved' ? <Check size={12} /> : <Save size={12} />}
        </button>

        {/* Clear button */}
        {hasStored && (
          <button
            onClick={handleClear}
            className="flex items-center rounded-md px-1.5 py-1.5 text-[#f38ba8]/60 hover:text-[#f38ba8] hover:bg-[#f38ba8]/10 transition-colors"
            title="مسح"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Status feedback */}
      {status === 'error' && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#f38ba8]">
          <AlertCircle size={10} />
          <span>فشل الحفظ — تحقق من إعدادات المتصفح</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Settings Panel ─────────────────────────────────────
export function SettingsPanel() {
  const { theme, setTheme } = useUIStore();
  const [agentProvider, setAgentProvider] = useState('groq');
  const [agentModel, setAgentModel] = useState('');

  useEffect(() => {
    try {
      const provider = localStorage.getItem(STORAGE_KEYS.agentProvider);
      const model = localStorage.getItem(STORAGE_KEYS.agentModel);
      if (provider) setAgentProvider(provider);
      if (model) setAgentModel(model);
    } catch { /* ignore */ }
  }, []);

  const saveAgentConfig = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.agentProvider, agentProvider);
      if (agentModel.trim()) {
        localStorage.setItem(STORAGE_KEYS.agentModel, agentModel.trim());
      }
    } catch { /* ignore */ }
  }, [agentProvider, agentModel]);

  const themes: { id: CodeforgeTheme; label: string; color: string }[] = [
    { id: 'dark', label: 'داكن', color: '#1e1e2e' },
    { id: 'light', label: 'فاتح', color: '#eff1f5' },
    { id: 'high-contrast', label: 'تباين عالي', color: '#000000' },
  ];

  return (
    <div className="flex flex-col gap-4 p-3 h-full overflow-y-auto">
      {/* ─── Section: GitHub ─── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Github size={14} className="text-[#cba6f7]" />
          <h3 className="text-xs font-semibold text-[#cdd6f4] uppercase tracking-wider">
            GitHub
          </h3>
        </div>
        <SecretField
          label="Personal Access Token"
          storageKey={STORAGE_KEYS.githubToken}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          icon={Key}
          helpUrl="https://github.com/settings/tokens"
          helpText="إنشاء توكن"
        />
        <p className="text-[10px] text-[#6c7086] mt-1.5 px-1">
          يُستخدم لعمليات GitHub (push, pull, إنشاء مستودعات...). يحتاج صلاحيات: repo, delete_repo
        </p>
      </div>

      {/* ─── Section: AI Models ─── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Cpu size={14} className="text-[#fab387]" />
          <h3 className="text-xs font-semibold text-[#cdd6f4] uppercase tracking-wider">
            نماذج الذكاء الاصطناعي
          </h3>
        </div>

        <div className="flex flex-col gap-2">
          <SecretField
            label="Groq API Key"
            storageKey={STORAGE_KEYS.groqApiKey}
            placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
            icon={Key}
            helpUrl="https://console.groq.com/keys"
            helpText="احصل على مفتاح"
          />

          <SecretField
            label="OpenAI API Key"
            storageKey={STORAGE_KEYS.openaiApiKey}
            placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
            icon={Key}
            helpUrl="https://platform.openai.com/api-keys"
            helpText="احصل على مفتاح"
          />

          <SecretField
            label="Ollama URL"
            storageKey={STORAGE_KEYS.ollamaUrl}
            placeholder="http://localhost:11434"
            icon={Cpu}
            isUrl={true}
          />
        </div>
      </div>

      {/* ─── Section: Agent Config ─── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={14} className="text-[#a6e3a1]" />
          <h3 className="text-xs font-semibold text-[#cdd6f4] uppercase tracking-wider">
            إعدادات الوكيل
          </h3>
        </div>

        <div className="rounded-lg border border-[#313244] bg-[#181825] p-3">
          <div className="flex flex-col gap-2">
            {/* Provider select */}
            <div>
              <label className="text-[10px] text-[#a6adc8] mb-1 block">المزود</label>
              <select
                value={agentProvider}
                onChange={(e) => {
                  setAgentProvider(e.target.value);
                  setTimeout(saveAgentConfig, 0);
                }}
                className="w-full rounded-md border border-[#313244] bg-[#1e1e2e] px-2 py-1.5 text-xs text-[#cdd6f4] focus:outline-none focus:ring-1 focus:ring-[#89b4fa]"
              >
                <option value="groq">Groq (سريع ومجاني)</option>
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="ollama">Ollama (محلي)</option>
              </select>
            </div>

            {/* Model name */}
            <div>
              <label className="text-[10px] text-[#a6adc8] mb-1 block">اسم النموذج</label>
              <input
                type="text"
                value={agentModel}
                onChange={(e) => setAgentModel(e.target.value)}
                onBlur={saveAgentConfig}
                placeholder={
                  agentProvider === 'groq'
                    ? 'llama-3.3-70b-versatile'
                    : agentProvider === 'openai'
                      ? 'gpt-4o'
                      : 'qwen2.5-coder:7b'
                }
                className="w-full rounded-md border border-[#313244] bg-[#1e1e2e] px-2 py-1.5 text-xs font-mono text-[#cdd6f4] placeholder:text-[#45475a] focus:outline-none focus:ring-1 focus:ring-[#89b4fa]"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section: Theme ─── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Palette size={14} className="text-[#f9e2af]" />
          <h3 className="text-xs font-semibold text-[#cdd6f4] uppercase tracking-wider">
            المظهر
          </h3>
        </div>

        <div className="flex gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-medium transition-all',
                theme === t.id
                  ? 'border-2 border-[#89b4fa] bg-[#89b4fa]/10 text-[#89b4fa]'
                  : 'border border-[#313244] bg-[#181825] text-[#6c7086] hover:border-[#45475a]'
              )}
            >
              <div
                className="w-3 h-3 rounded-full border border-[#45475a]"
                style={{ backgroundColor: t.color }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Section: Reset ─── */}
      <div className="mt-2 pt-3 border-t border-[#313244]">
        <button
          onClick={() => {
            if (confirm('هل تريد مسح جميع الإعدادات المحفوظة؟ هذا لن يحذف ملفاتك.')) {
              Object.values(STORAGE_KEYS).forEach((key) => {
                try { localStorage.removeItem(key); } catch { /* ignore */ }
              });
              window.location.reload();
            }
          }}
          className="flex items-center gap-1.5 text-[10px] text-[#f38ba8]/70 hover:text-[#f38ba8] transition-colors"
        >
          <RotateCcw size={10} />
          إعادة تعيين جميع الإعدادات
        </button>
      </div>
    </div>
  );
}
