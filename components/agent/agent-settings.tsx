'use client';

/**
 * CodeForge IDE — Agent Settings v2.0 (Phase 9)
 * Settings panel for configuring the AI agent:
 * provider selection, API key, model, temperature, language,
 * GitHub PAT, and NEW: Groq/OODA integration with ModelSelector.
 *
 * v2.0 Changes:
 *   - Replaced static <select> with ModelSelector component for Groq
 *   - Added OODA Self-Improve section with Groq API key
 *   - Added OODA status indicator
 *   - Backward compatible: non-Groq providers still use legacy dropdown
 */

import React, { useState } from 'react';
import { useAgentStore } from '@/lib/stores/agent-store';
import {
  getAllProviders,
  getProvider,
  validateApiKeyFormat,
} from '@/lib/agent/providers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ProviderId } from '@/lib/agent/types';
import { ModelSelector } from './model-selector';
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
  Brain,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface AgentSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional: Groq API key for OODA (can be separate from main provider key) */
  groqApiKey?: string;
  onGroqApiKeyChange?: (key: string) => void;
  /** Optional: OODA readiness status */
  isOODAReady?: boolean;
  /** Optional: OODA model */
  oodaModel?: string;
}

export function AgentSettings({
  isOpen,
  onClose,
  groqApiKey: externalGroqKey,
  onGroqApiKeyChange,
  isOODAReady = false,
  oodaModel,
}: AgentSettingsProps) {
  const {
    config,
    setProvider,
    setApiKey,
    setModel,
    setGitHubToken,
    updateConfig,
  } = useAgentStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(config.apiKey);
  const [tempGithubToken, setTempGithubToken] = useState(
    config.githubToken || ''
  );
  const [tempGroqKey, setTempGroqKey] = useState(externalGroqKey || '');
  const [activeTab, setActiveTab] = useState<'provider' | 'ooda'>('provider');

  if (!isOpen) return null;

  const providers = getAllProviders();
  const currentProvider = getProvider(config.provider);
  const isKeyValid = validateApiKeyFormat(config.provider, tempApiKey);
  const isGithubTokenValid = tempGithubToken.length > 20;
  const isGroqKeyValid =
    tempGroqKey.startsWith('gsk_') && tempGroqKey.length > 20;
  const isGroqProvider = config.provider === 'groq';

  const handleSaveApiKey = () => {
    setApiKey(tempApiKey);
  };

  const handleSaveGithubToken = () => {
    setGitHubToken(tempGithubToken);
  };

  const handleSaveGroqKey = () => {
    onGroqApiKeyChange?.(tempGroqKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-[520px] max-h-[90vh] bg-[#1e1e2e] rounded-2xl border border-[#313244] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#313244]">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-[#89b4fa]" />
            <h2 className="text-sm font-semibold text-[#cdd6f4]">
              إعدادات الوكيل الذكي
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#313244]">
          <button
            onClick={() => setActiveTab('provider')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'provider'
                ? 'text-[#89b4fa] border-b-2 border-[#89b4fa] bg-[#89b4fa]/5'
                : 'text-[#6c7086] hover:text-[#cdd6f4]'
            }`}
          >
            <Cpu size={12} />
            المزود والنموذج
          </button>
          <button
            onClick={() => setActiveTab('ooda')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'ooda'
                ? 'text-[#a6e3a1] border-b-2 border-[#a6e3a1] bg-[#a6e3a1]/5'
                : 'text-[#6c7086] hover:text-[#cdd6f4]'
            }`}
          >
            <Brain size={12} />
            التحسين الذاتي (OODA)
            {isOODAReady && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#a6e3a1] animate-pulse" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-5 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* ═══ TAB 1: Provider & Model ═══ */}
          {activeTab === 'provider' && (
            <>
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
                      <div className="text-sm font-medium text-[#cdd6f4]">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-[#6c7086] mt-0.5">
                        {p.description}
                      </div>
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
                  <div
                    className={`flex items-center gap-1 mt-1.5 text-[10px] ${isKeyValid ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}`}
                  >
                    {isKeyValid ? (
                      <CheckCircle2 size={10} />
                    ) : (
                      <XCircle size={10} />
                    )}
                    {isKeyValid
                      ? 'صيغة المفتاح صحيحة'
                      : 'صيغة المفتاح غير صحيحة'}
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
                      {showGithubToken ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
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
                  <div
                    className={`flex items-center gap-1 mt-1.5 text-[10px] ${isGithubTokenValid ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}`}
                  >
                    {isGithubTokenValid ? (
                      <CheckCircle2 size={10} />
                    ) : (
                      <XCircle size={10} />
                    )}
                    {isGithubTokenValid
                      ? 'توكن GitHub صالح'
                      : 'التوكن قصير جداً'}
                  </div>
                )}
                <p className="text-[9px] text-[#45475a] mt-1.5">
                  يستخدم لإنشاء مستودعات، رفع ملفات، إنشاء فروع و Pull Requests
                  على GitHub. الصلاحيات المطلوبة:{' '}
                  <span className="text-[#89b4fa] font-mono">repo</span>
                </p>
              </div>

              {/* Model Selection — Enhanced for Groq */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#cdd6f4] mb-2">
                  <Cpu size={12} className="text-[#a6e3a1]" />
                  النموذج
                  {isGroqProvider && (
                    <span className="text-[9px] text-[#a6e3a1] bg-[#a6e3a1]/10 px-1.5 py-0.5 rounded-full">
                      14 نموذج متاح
                    </span>
                  )}
                </label>

                {isGroqProvider ? (
                  /* ═══ NEW: ModelSelector for Groq ═══ */
                  <ModelSelector
                    selectedModel={config.model}
                    onModelChange={(modelId) => setModel(modelId)}
                    disabled={!config.apiKey}
                  />
                ) : (
                  /* Legacy dropdown for other providers */
                  <select
                    value={config.model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#313244] text-[#cdd6f4] text-sm outline-none focus:ring-1 focus:ring-[#89b4fa]/50 appearance-none cursor-pointer"
                  >
                    {currentProvider.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({(m.contextWindow / 1000).toFixed(0)}K
                        context)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Temperature */}
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-[#cdd6f4] mb-2">
                  <span className="flex items-center gap-1.5">
                    <Thermometer size={12} className="text-[#fab387]" />
                    درجة الإبداع (Temperature)
                  </span>
                  <span className="font-mono text-[#89b4fa]">
                    {config.temperature}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) =>
                    updateConfig({ temperature: parseFloat(e.target.value) })
                  }
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
            </>
          )}

          {/* ═══ TAB 2: OODA Self-Improvement ═══ */}
          {activeTab === 'ooda' && (
            <>
              {/* OODA Status Card */}
              <div
                className={`p-4 rounded-xl border ${
                  isOODAReady
                    ? 'border-[#a6e3a1]/30 bg-[#a6e3a1]/5'
                    : 'border-[#f38ba8]/30 bg-[#f38ba8]/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isOODAReady ? 'bg-[#a6e3a1]/20' : 'bg-[#f38ba8]/20'
                    }`}
                  >
                    {isOODAReady ? (
                      <RefreshCw size={20} className="text-[#a6e3a1]" />
                    ) : (
                      <Brain size={20} className="text-[#f38ba8]" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#cdd6f4]">
                      {isOODAReady ? 'محرك OODA نشط ✨' : 'محرك OODA غير مفعّل'}
                    </div>
                    <div className="text-[10px] text-[#6c7086]">
                      {isOODAReady
                        ? `النموذج: ${oodaModel || 'llama-3.3-70b-versatile'}`
                        : 'أضف مفتاح Groq API لتفعيل التحسين الذاتي'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Groq API Key */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#cdd6f4] mb-2">
                  <Zap size={12} className="text-[#f9e2af]" />
                  مفتاح Groq API
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#89b4fa] hover:underline flex items-center gap-0.5"
                  >
                    <ExternalLink size={10} />
                    الحصول على مفتاح مجاني
                  </a>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showGroqKey ? 'text' : 'password'}
                      value={tempGroqKey}
                      onChange={(e) => setTempGroqKey(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full px-3 py-2 rounded-lg bg-[#313244] text-[#cdd6f4] text-sm font-mono placeholder:text-[#45475a] outline-none focus:ring-1 focus:ring-[#f9e2af]/50"
                      dir="ltr"
                    />
                    <button
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6c7086] hover:text-[#cdd6f4]"
                    >
                      {showGroqKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={handleSaveGroqKey}
                    disabled={!tempGroqKey}
                    className="px-4 py-2 rounded-lg bg-[#f9e2af] text-[#1e1e2e] text-xs font-medium hover:bg-[#f9e2af]/80 disabled:opacity-30 transition-colors"
                  >
                    تفعيل
                  </button>
                </div>
                {tempGroqKey && (
                  <div
                    className={`flex items-center gap-1 mt-1.5 text-[10px] ${isGroqKeyValid ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}`}
                  >
                    {isGroqKeyValid ? (
                      <CheckCircle2 size={10} />
                    ) : (
                      <XCircle size={10} />
                    )}
                    {isGroqKeyValid
                      ? 'صيغة المفتاح صحيحة'
                      : 'المفتاح يجب أن يبدأ بـ gsk_'}
                  </div>
                )}
              </div>

              {/* OODA Model Selector */}
              {isOODAReady && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[#cdd6f4] mb-2">
                    <Brain size={12} className="text-[#a6e3a1]" />
                    نموذج التحسين الذاتي
                  </label>
                  <ModelSelector
                    selectedModel={oodaModel || 'llama-3.3-70b-versatile'}
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    onModelChange={(modelId) => {
                      // This will be handled by the parent component
                      // through the OODABridge configuration
                    }}
                    showDetails={true}
                  />
                </div>
              )}

              {/* How it works */}
              <div className="p-3 rounded-xl bg-[#181825] border border-[#313244]">
                <div className="text-[10px] font-medium text-[#6c7086] mb-2">
                  كيف يعمل التحسين الذاتي؟
                </div>
                <div className="space-y-1.5">
                  {[
                    {
                      icon: '👁️',
                      label: 'رصد',
                      desc: 'يكتشف المشكلة تلقائياً من وصفك',
                    },
                    {
                      icon: '🧭',
                      label: 'تحليل',
                      desc: 'يحلل السبب الجذري باستخدام الذكاء الاصطناعي',
                    },
                    {
                      icon: '📋',
                      label: 'قرار',
                      desc: 'يكتب خطة إصلاح مع كود جاهز',
                    },
                    {
                      icon: '⚡',
                      label: 'تنفيذ',
                      desc: 'يطبق الإصلاحات مع نسخ احتياطية',
                    },
                    {
                      icon: '✅',
                      label: 'تحقق',
                      desc: 'يفحص 6 فحوصات آلية للتأكد',
                    },
                  ].map((step) => (
                    <div key={step.label} className="flex items-center gap-2">
                      <span className="text-xs">{step.icon}</span>
                      <span className="text-[10px] text-[#cdd6f4] font-medium w-10">
                        {step.label}
                      </span>
                      <span className="text-[10px] text-[#6c7086]">
                        {step.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sync hint */}
              {config.provider === 'groq' && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#89b4fa]/10 border border-[#89b4fa]/20">
                  <Zap size={12} className="text-[#89b4fa]" />
                  <span className="text-[10px] text-[#89b4fa]">
                    تلميح: المزود الأساسي هو Groq — يمكن مشاركة نفس المفتاح مع
                    محرك OODA
                  </span>
                </div>
              )}
            </>
          )}
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
