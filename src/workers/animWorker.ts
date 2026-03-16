// src/workers/animWorker.ts

export interface Particle {
  id: number;
  x: number;     // Percentage (0-100)
  y: number;     // Percentage (0-100)
  cR: number;     //Red Coloring
  cG: number;     //Green Coloring
  cB: number;     //Blue Coloring
  speed: number; // Downward velocity
}

let particles: Particle[] = [];
let nextId = 1;
let lastTime = performance.now();
let isRunning = false;

const tick = () => {
  const now = performance.now();
  const dt = now - lastTime;
  lastTime = now;

  // Move particles down
  particles.forEach(p => {
    p.y += p.speed * dt;
  });

  // Garbage collection: Remove particles that fell off the bottom (past 110%)
  particles = particles.filter(p => p.y < 110);

  // Send the computed frame to the main UI thread
  self.postMessage({ type: 'tick', particles });

  // If we still have particles, queue the next frame
  if (particles.length > 0) {
    setTimeout(tick, 16); 
  } else {
    isRunning = false; // Sleep worker to save CPU when no particles exist
  }
};

self.onmessage = (e: MessageEvent) => {
  if (e.data.type === 'spawn') {
    particles.push({
      id: nextId++,
      x: Math.random() * 100,             // Random horizontal start (0% to 100%)
      y: -5,                              // Start slightly above the top of the screen
      cR: Math.floor(Math.random() * 256),
      cG: Math.floor(Math.random() * 256),
      cB: Math.floor(Math.random() * 256),
      speed: 0.05 + Math.random() * 0.05  // Randomize falling speed
    });

    // Wake up the physics loop if it was asleep
    if (!isRunning) {
      isRunning = true;
      lastTime = performance.now();
      tick();
    }
  }
};
