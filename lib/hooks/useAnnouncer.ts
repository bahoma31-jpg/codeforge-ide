import { useCallback } from 'react';

type AnnouncementPriority = 'polite' | 'assertive';

/**
 * Hook for making screen reader announcements
 * @example
 * const { announce } = useAnnouncer();
 * announce('File saved successfully');
 * announce('Error occurred', 'assertive');
 */
export function useAnnouncer() {
  const announce = useCallback(
    (message: string, priority: AnnouncementPriority = 'polite') => {
      const announcer = document.getElementById('live-region');
      if (!announcer) {
        console.warn('Live region not found. Add <LiveRegion /> to your layout.');
        return;
      }

      // Set priority
      announcer.setAttribute('aria-live', priority);
      
      // Clear previous message
      announcer.textContent = '';
      
      // Add new message after a brief delay to ensure screen readers detect the change
      setTimeout(() => {
        announcer.textContent = message;
      }, 100);

      // Clear message after it's been announced
      setTimeout(() => {
        announcer.textContent = '';
      }, 3000);
    },
    []
  );

  return { announce };
}
