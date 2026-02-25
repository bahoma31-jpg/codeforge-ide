'use client';

import SettingsList from './settings-list';

/**
 * Main settings view component
 * Displays the settings management interface in the sidebar
 */
export default function SettingsView() {
  return (
    <div className="flex h-full flex-col">
      <SettingsList />
    </div>
  );
}
