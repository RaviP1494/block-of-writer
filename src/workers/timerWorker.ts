// src/workers/timerWorker.ts

let timerId: ReturnType<typeof setTimeout> | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, delay } = e.data;

  // Clear existing timer on stop or reset
  if (type === 'stop' || type === 'reset') {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  // Start a new timer on start or reset
  if (type === 'start' || type === 'reset') {
    timerId = setTimeout(() => {
      self.postMessage({ type: 'spurt_timeout' });
    }, delay);
  }
};
