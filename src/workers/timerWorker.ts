let flashTimerID: ReturnType<typeof setTimeout> | null = null;
let flickerTimerID: ReturnType<typeof setTimeout> | null = null;
let tickerID: ReturnType<typeof setInterval> | null = null;

let flashTarget = 0;
let flickerTarget = 0;

const stopTicker = () => {
  if (tickerID) clearInterval(tickerID);
  tickerID = null;
};

const startTicker = () => {
  stopTicker();
  tickerID = setInterval(() => {
    const now = Date.now();
    
    // Calculate remaining time, flooring at 0 so we don't send negative numbers
    const flashRemaining = flashTarget > 0 ? Math.max(0, flashTarget - now) : 0;
    const flickerRemaining = flickerTarget > 0 ? Math.max(0, flickerTarget - now) : 0;

    self.postMessage({
      type: 'tick',
      flashRemaining,
      flickerRemaining
    });

    // If both timers are done/cleared, kill the interval to save CPU
    if (flashTarget === 0 && flickerTarget === 0) {
      stopTicker();
    }
  }, 75); // 50ms update rate gives you smooth visuals without stressing the thread
};

self.onmessage = (e: MessageEvent) => {
  const { type, flashDelay, flickerDelay } = e.data;

  if (type === 'stop' || type === 'reset') {
    if (flashTimerID) clearTimeout(flashTimerID);
    if (flickerTimerID) clearTimeout(flickerTimerID);
    flashTimerID = null;
    flickerTimerID = null;
    flashTarget = 0;
    flickerTarget = 0;
    stopTicker();
  } else if (type === 'stop_flash') {
    if (flashTimerID) clearTimeout(flashTimerID);
    flashTimerID = null;
    flashTarget = 0;
    // Note: We don't stop the ticker here, because the flicker timer might still be running!
  }

  if (type === 'start' || type === 'reset') {
    const now = Date.now();

    // 1. Start Flash Timer & log its target time
    flashTarget = now + flashDelay;
    flashTimerID = setTimeout(() => {
      flashTarget = 0;
      self.postMessage({ type: 'flash_timeout' });
    }, flashDelay);

    // 2. Start Beam Timer & log its target time
    if (flickerDelay && flickerDelay > flashDelay) {
      flickerTarget = now + flickerDelay;
      flickerTimerID = setTimeout(() => {
        flickerTarget = 0;
        self.postMessage({ type: 'flicker_timeout' });
      }, flickerDelay);
    }

    // Start broadcasting the countdowns to the UI
    startTicker();
  }
}
