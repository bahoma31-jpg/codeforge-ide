'use client';

/**
 * CodeForge IDE — Model Selector Dropdown
 * Custom dropdown for selecting Groq AI models.
 *
 * Features:
 * - 14 models across 4 grouped categories
 * - Arabic RTL interface with dark theme
 * - Speed/quality badges per model
 * - ⭐ Recommended model indicators
 * - Search/filter within dropdown
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Click-outside to close
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MODEL_GROUPS,
  GROQ_MODELS,
  getModelById,
  type GroqModel,
  type ModelType,
} from '@/lib/agent/llm';
import { ChevronDown, Search, Zap, Brain, Mic, Volume2, Star, Check } from 'lucide-react';
import './model-selector.css';

// ─── Props ───────────────────────────────────────────────────

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  language?: 'ar' | 'en';
  disabled?: boolean;
  compact?: boolean;
}

// ─── Category Icons ──────────────────────────────────────────

const TYPE_ICONS: Record<ModelType, React.ReactNode> = {
  text: <Brain size={14} className="ms-type-icon--text" />,
  compound: <Zap size={14} className="ms-type-icon--compound" />,
  stt: <Mic size={14} className="ms-type-icon--stt" />,
  tts: <Volume2 size={14} className="ms-type-icon--tts" />,
};

const SPEED_LABELS: Record<string, { en: string; ar: string; className: string }> = {
  instant: { en: 'Instant', ar: 'فوري', className: 'ms-badge--instant' },
  fast: { en: 'Fast', ar: 'سريع', className: 'ms-badge--fast' },
  medium: { en: 'Medium', ar: 'متوسط', className: 'ms-badge--medium' },
  slow: { en: 'Slow', ar: 'بطيء', className: 'ms-badge--slow' },
};

// ─── Component ───────────────────────────────────────────────

export function ModelSelector({
  selectedModelId,
  onModelChange,
  language = 'ar',
  disabled = false,
  compact = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isAr = language === 'ar';
  const selectedModel = getModelById(selectedModelId);

  // Filter models based on search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return MODEL_GROUPS;

    const q = search.toLowerCase();
    return MODEL_GROUPS
      .map(group => ({
        ...group,
        models: group.models.filter(
          m =>
            m.id.toLowerCase().includes(q) ||
            m.name.toLowerCase().includes(q) ||
            m.nameAr.includes(q) ||
            m.descriptionAr.includes(q)
        ),
      }))
      .filter(g => g.models.length > 0);
  }, [search]);

  // Flat list for keyboard nav
  const flatModels = useMemo(
    () => filteredGroups.flatMap(g => g.models),
    [filteredGroups]
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => Math.min(prev + 1, flatModels.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && flatModels[highlightIndex]) {
          onModelChange(flatModels[highlightIndex].id);
          setIsOpen(false);
          setSearch('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearch('');
        break;
    }
  };

  const handleSelect = (model: GroqModel) => {
    onModelChange(model.id);
    setIsOpen(false);
    setSearch('');
  };

  // ─── Render ─────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={`ms-container ${compact ? 'ms-container--compact' : ''}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className={`ms-trigger ${isOpen ? 'ms-trigger--open' : ''} ${disabled ? 'ms-trigger--disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="ms-trigger__content">
          {selectedModel ? (
            <>
              <span className="ms-trigger__icon">
                {TYPE_ICONS[selectedModel.type]}
              </span>
              <span className="ms-trigger__name">
                {isAr ? selectedModel.nameAr : selectedModel.name}
              </span>
              {selectedModel.recommended && (
                <Star size={12} className="ms-trigger__star" />
              )}
              {!compact && (
                <span className={`ms-badge ${SPEED_LABELS[selectedModel.speed].className}`}>
                  {isAr ? SPEED_LABELS[selectedModel.speed].ar : SPEED_LABELS[selectedModel.speed].en}
                </span>
              )}
            </>
          ) : (
            <span className="ms-trigger__placeholder">
              {isAr ? 'اختر النموذج...' : 'Select model...'}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`ms-trigger__chevron ${isOpen ? 'ms-trigger__chevron--open' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="ms-dropdown" role="listbox">
          {/* Search */}
          <div className="ms-dropdown__search">
            <Search size={14} className="ms-dropdown__search-icon" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightIndex(-1);
              }}
              placeholder={isAr ? 'ابحث عن نموذج...' : 'Search models...'}
              className="ms-dropdown__search-input"
              dir={isAr ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Model List */}
          <div ref={listRef} className="ms-dropdown__list">
            {filteredGroups.length === 0 ? (
              <div className="ms-dropdown__empty">
                {isAr ? 'لا توجد نتائج' : 'No results'}
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.type} className="ms-group">
                  {/* Group Header */}
                  <div className="ms-group__header">
                    <span className="ms-group__icon">{group.icon}</span>
                    <span className="ms-group__label">
                      {isAr ? group.labelAr : group.label}
                    </span>
                    <span className="ms-group__count">{group.models.length}</span>
                  </div>

                  {/* Group Models */}
                  {group.models.map((model) => {
                    const flatIdx = flatModels.indexOf(model);
                    const isSelected = model.id === selectedModelId;
                    const isHighlighted = flatIdx === highlightIndex;

                    return (
                      <button
                        key={model.id}
                        type="button"
                        className={`ms-model ${
                          isSelected ? 'ms-model--selected' : ''
                        } ${
                          isHighlighted ? 'ms-model--highlighted' : ''
                        }`}
                        onClick={() => handleSelect(model)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="ms-model__main">
                          <div className="ms-model__header">
                            <span className="ms-model__name">
                              {isAr ? model.nameAr : model.name}
                            </span>
                            {model.recommended && (
                              <Star size={11} className="ms-model__star" fill="currentColor" />
                            )}
                            {isSelected && (
                              <Check size={14} className="ms-model__check" />
                            )}
                          </div>
                          <div className="ms-model__desc">
                            {isAr ? model.descriptionAr : model.description}
                          </div>
                        </div>
                        <div className="ms-model__badges">
                          <span className={`ms-badge ${SPEED_LABELS[model.speed].className}`}>
                            {isAr ? SPEED_LABELS[model.speed].ar : SPEED_LABELS[model.speed].en}
                          </span>
                          {model.contextWindow > 0 && (
                            <span className="ms-badge ms-badge--context">
                              {(model.contextWindow / 1000).toFixed(0)}K
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer: Model Count */}
          <div className="ms-dropdown__footer">
            {isAr
              ? `${GROQ_MODELS.length} نموذج متاح عبر Groq`
              : `${GROQ_MODELS.length} models available via Groq`}
          </div>
        </div>
      )}
    </div>
  );
}
