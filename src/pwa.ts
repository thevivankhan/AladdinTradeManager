export const setupPWA = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
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
