'use client';

import { Setting, useSettingsStore } from '@/lib/stores/settings-store';
import { RotateCcw } from 'lucide-react';

type SettingItemProps = {
  setting: Setting;
};

export default function SettingItem({ setting }: SettingItemProps) {
  const { updateSetting, resetSetting } = useSettingsStore();

  const isModified = setting.value !== setting.defaultValue;

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-sm font-semibold">{setting.label}</h3>
          <p className="text-xs text-muted-foreground">
            {setting.description}
          </p>
        </div>

        {isModified && (
          <button
            onClick={() => resetSetting(setting.id)}
            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Reset to default"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Boolean input */}
      {setting.type === 'boolean' && (
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={setting.value as boolean}
            onChange={(e) => updateSetting(setting.id, e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
          <span className="text-xs text-muted-foreground">
            {setting.value ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      )}

      {/* Number input */}
      {setting.type === 'number' && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={setting.value as number}
            onChange={(e) =>
              updateSetting(setting.id, parseInt(e.target.value, 10))
            }
            min={setting.min}
            max={setting.max}
            className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {setting.min !== undefined && setting.max !== undefined && (
            <span className="text-xs text-muted-foreground">
              ({setting.min}-{setting.max})
            </span>
          )}
        </div>
      )}

      {/* String input */}
      {setting.type === 'string' && (
        <input
          type="text"
          value={setting.value as string}
          onChange={(e) => updateSetting(setting.id, e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      )}

      {/* Select input */}
      {setting.type === 'select' && setting.options && (
        <select
          value={setting.value as string}
          onChange={(e) => updateSetting(setting.id, e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {setting.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* Show current value for reference */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">{setting.id}</span>
        {isModified && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
            Modified
          </span>
        )}
      </div>
    </div>
  );
}
