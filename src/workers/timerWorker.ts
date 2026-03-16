let spurtTimerId: ReturnType<typeof setTimeout> | null = null;
let burstTimerId: ReturnType<typeof setTimeout> | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, spurtDelay, burstDelay, burstMode } = e.data;

  if (type === 'stop' || type === 'reset') {
    if (spurtTimerId) clearTimeout(spurtTimerId);
    if (burstTimerId) clearTimeout(burstTimerId);
    spurtTimerId = null;
    burstTimerId = null;
  }

  if (type === 'start' || type === 'reset') {
    // 1. Always start the Spurt Timer
    spurtTimerId = setTimeout(() => {
      self.postMessage({ type: 'spurt_timeout' });
    }, spurtDelay);

    // 2. If Burst Mode is on, start the Burst Timer too
    if (burstMode && burstDelay) {
      burstTimerId = setTimeout(() => {
        self.postMessage({ type: 'burst_timeout' });
      }, burstDelay);
    }
  }
};

