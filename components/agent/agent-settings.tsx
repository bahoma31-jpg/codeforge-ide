'use client';

/**
 * CodeForge IDE — Agent Settings
 * Settings panel for configuring the AI agent:
 * provider selection, API key, model, temperature, language,
 * and GitHub Personal Access Token.
 */

import React, { useState } from 'react';
import { useAgentStore } from '@/lib/stores/agent-store';
import { getAllProviders, getProvider, validateApiKeyFormat } from '@/lib/agent/providers';
import type { ProviderId } from '@/lib/agent/types';
import {
  Settings,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Globe,
  Cpu,
  Key,
  Thermometer,
  Languages,
  Github,
} from 'lucide-react';

interface AgentSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentSettings({ isOpen, onClose }: AgentSettingsProps) {
  const { config, setProvider, setApiKey, setModel, setGitHubToken, updateConfig } = useAgentStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(config.apiKey);
  const [tempGithubToken, setTempGithubToken] = useState(config.githubToken || '');

  if (!isOpen) return null;

  const providers = getAllProviders();
  const currentProvider = getProvider(config.provider);
  const isKeyValid = validateApiKeyFormat(config.provider, tempApiKey);
  const isGithubTokenValid = tempGithubToken.length > 20;

  const handleSaveApiKey = () => {
    setApiKey(tempApiKey);
  };

  const handleSaveGithubToken = () => {
    setGitHubToken(tempGithubToken);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-[480px] max-h-[85vh] bg-[#1e1e2e] rounded-2xl border border-[#313244] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#313244]">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-[#89b4fa]" />
            <h2 className="text-sm font-semibold text-[#cdd6f4]">إعدادات الوكيل الذكي</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-5 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Provider Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#cdd6f4] mb-2">
              <Globe size={12} className="text-[#89b4fa]" />
              المزود (Provider)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProvider(p.id);
                    setTempApiKey('');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    config.provider === p.id
                      ? 'border-[#89b4fa] bg-[#89b4fa]/10'
                      : 'border-[#313244] bg-[#181825] hover:border-[#45475a]'
                  }`}
                >
                  <div className="text-sm font-medium text-[#cdd6f4]">{p.name}</div>
                  <div className="text-[10px] text-[#6c7086] mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#cdd6f4] mb-2">
              <Key size={12} className="text-[#f9e2af]" />
              مفتاح API
              <a
                href={currentProvider.apiKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#89b4fa] hover:underline flex items-center gap-0.5"
              >
                <ExternalLink size={10} />
                الحصول على مفتاح
              </a>
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder={currentProvider.apiKeyPlaceholder}
                  className="w-full px-3 py-2 rounded-lg bg-[#313244] text-[#cdd6f4] text-sm font-mono placeholder:text-[#45475a] outline-none focus:ring-1 focus:ring-[#89b4fa]/50"
                  dir="ltr"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6c7086] hover:text-[#cdd6f4]"
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                onClick={handleSaveApiKey}
                disabled={!tempApiKey}
                className="px-4 py-2 rounded-lg bg-[#89b4fa] text-[#1e1e2e] text-xs font-medium hover:bg-[#89b4fa]/80 disabled:opacity-30 transition-colors"
              >
                حفظ
              </button>
            </div>
            {tempApiKey && (
              <div className={`flex items-center gap-1 mt-1.5 text-[10px] ${isKeyValid ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}`}>
                {isKeyValid ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                {isKeyValid ? 'صيغة المفتاح صحيحة' : 'صيغة المفتاح غير صحيحة'}
              </div>
            )}
          </div>

          {/* GitHub Personal Access Token */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#cdd6f4] mb-2">
              <Github size={12} className="text-[#cba6f7]" />
              GitHub Token
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:org&description=CodeForge+IDE+Agent"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#89b4fa] hover:underline flex items-center gap-0.5"
              >
                <ExternalLink size={10} />
                إنشاء توكن
              </a>
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showGithubToken ? 'text' : 'password'}
                  value={tempGithubToken}
                  onChange={(e) => setTempGithubToken(e.target.value)}
                  placeholder="ghp_... أو github_pat_..."
                  className="w-full px-3 py-2 rounded-lg bg-[#313244] text-[#cdd6f4] text-sm font-mono placeholder:text-[#45475a] outline-none focus:ring-1 focus:ring-[#cba6f7]/50"
                  dir="ltr"
                />
                <button
                  onClick={() => setShowGithubToken(!showGithubToken)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6c7086] hover:text-[#cdd6f4]"
                >
                  {showGithubToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                onClick={handleSaveGithubToken}
                disabled={!tempGithubToken}
                className="px-4 py-2 rounded-lg bg-[#cba6f7] text-[#1e1e2e] text-xs font-medium hover:bg-[#cba6f7]/80 disabled:opacity-30 transition-colors"
              >
                حفظ
              </button>
            </div>
            {tempGithubToken && (
              <div className={`flex items-center gap-1 mt-1.5 text-[10px] ${isGithubTokenValid ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}`}>
                {isGithubTokenValid ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                {isGithubTokenValid ? 'توكن GitHub صالح' : 'التوكن قصير جداً'}
              </div>
            )}
            <p className="text-[9px] text-[#45475a] mt-1.5">
              يستخدم لإنشاء مستودعات، رفع ملفات، إنشاء فروع و Pull Requests على GitHub.
              الصلاحيات المطلوبة: <span className="text-[#89b4fa] font-mono">repo</span>
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#cdd6f4] mb-2">
              <Cpu size={12} className="text-[#a6e3a1]" />
              النموذج
            </label>
            <select
              value={config.model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#313244] text-[#cdd6f4] text-sm outline-none focus:ring-1 focus:ring-[#89b4fa]/50 appearance-none cursor-pointer"
            >
              {currentProvider.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({(m.contextWindow / 1000).toFixed(0)}K context)
                </option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="flex items-center justify-between text-xs font-medium text-[#cdd6f4] mb-2">
              <span className="flex items-center gap-1.5">
                <Thermometer size={12} className="text-[#fab387]" />
                درجة الإبداع (Temperature)
              </span>
              <span className="font-mono text-[#89b4fa]">{config.temperature}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-[#89b4fa]"
            />
            <div className="flex justify-between text-[9px] text-[#45475a] mt-1">
              <span>دقيق (0.0)</span>
              <span>إبداعي (1.0)</span>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#cdd6f4] mb-2">
              <Languages size={12} className="text-[#cba6f7]" />
              لغة التواصل
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateConfig({ language: 'ar' })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  config.language === 'ar'
                    ? 'bg-[#89b4fa] text-[#1e1e2e]'
                    : 'bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4]'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => updateConfig({ language: 'en' })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  config.language === 'en'
                    ? 'bg-[#89b4fa] text-[#1e1e2e]'
                    : 'bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4]'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#313244] bg-[#181825]">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] text-xs font-medium transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
