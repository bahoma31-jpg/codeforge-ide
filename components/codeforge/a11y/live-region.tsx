/**
 * Live Region Component for Screen Reader Announcements
 * Provides a hidden aria-live region for dynamic content updates
 */
export function LiveRegion() {
  return (
    <div
      id="live-region"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  );
}
