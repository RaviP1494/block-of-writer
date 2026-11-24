declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

export const initAnalytics = () => {
  if (initialized || typeof window === 'undefined') return;

  const rawId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  const measurementId = rawId?.trim();
  if (!import.meta.env.PROD || !measurementId) return;

  initialized = true;

  window.dataLayer = window.dataLayer || [];
  // gtag.js requires pushing `arguments` (not a rest array) onto dataLayer
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
};

export const trackEvent = (eventName: string) => {
  if (!initialized || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', eventName);
};
