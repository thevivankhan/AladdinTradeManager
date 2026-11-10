export const setupPWA = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Lock orientation to portrait if supported (e.g., installed PWA or standalone mode)
  if (typeof screen !== 'undefined' && 'orientation' in screen && screen.orientation && typeof (screen.orientation as any).lock === 'function') {
    try {
      (screen.orientation as any).lock('portrait-primary').catch(() => {
        // Screen orientation lock not supported by browser/user preferences or requires user gesture
      });
    } catch (_) {}
  }

  // Register /sw.js reliably across dev, preview, and production
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Periodic check for updates when returning to the tab
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 1000);
      })
      .catch((err) => {
        console.debug('ServiceWorker registration error:', err);
      });
  });
};
