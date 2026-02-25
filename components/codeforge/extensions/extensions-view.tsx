'use client';

import ExtensionsList from './extensions-list';

/**
 * Main extensions view component
 * Displays the extensions management interface in the sidebar
 */
export default function ExtensionsView() {
  return (
    <div className="flex h-full flex-col">
      <ExtensionsList />
    </div>
  );
}
