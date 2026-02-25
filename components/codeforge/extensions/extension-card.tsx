'use client';

import { Extension, useExtensionsStore } from '@/lib/stores/extensions-store';
import {
  Download,
  Star,
  Check,
  X,
  Settings,
  FileCode2,
  FileCode,
  Globe,
  Sparkles,
  ShieldCheck,
  Palette,
  GitBranch,
  Braces,
  Tags,
  Wind,
} from 'lucide-react';

type ExtensionCardProps = {
  extension: Extension;
};

/**
 * Icon map for extensions
 */
const ICON_MAP = {
  FileCode2,
  FileCode,
  Globe,
  Sparkles,
  ShieldCheck,
  Palette,
  GitBranch,
  Braces,
  Tags,
  Wind,
  Settings,
} as const;

/**
 * Format download count
 */
function formatDownloads(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function ExtensionCard({ extension }: ExtensionCardProps) {
  const { toggleExtension, uninstallExtension } = useExtensionsStore();

  const IconComponent =
    ICON_MAP[extension.icon as keyof typeof ICON_MAP] ?? Settings;

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <IconComponent className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-1 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-sm">
                {extension.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {extension.publisher}
              </p>
            </div>

            {/* Status badge */}
            {extension.isEnabled ? (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Check className="h-3 w-3" />
                Enabled
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <X className="h-3 w-3" />
                Disabled
              </span>
            )}
          </div>

          {/* Description */}
          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
            {extension.description}
          </p>

          {/* Meta info */}
          <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {formatDownloads(extension.downloads)}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {extension.rating.toFixed(1)}
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
              v{extension.version}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {extension.isEnabled ? (
              <>
                <button
                  onClick={() => toggleExtension(extension.id)}
                  className="rounded bg-secondary px-3 py-1 text-xs font-medium transition-colors hover:bg-secondary/80"
                >
                  Disable
                </button>
                {!extension.isBuiltIn && (
                  <button
                    onClick={() => uninstallExtension(extension.id)}
                    className="rounded bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                  >
                    Uninstall
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => toggleExtension(extension.id)}
                className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Enable
              </button>
            )}

            {extension.isBuiltIn && (
              <span className="ml-auto text-xs text-muted-foreground">
                Built-in
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
