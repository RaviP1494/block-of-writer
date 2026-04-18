import { type Component, onMount, onCleanup } from 'solid-js';

// We use [top, left] to match your tuple requirement
export type PointTuple = [number, number]; 

interface ActiveParticle {
  id: string | number;
  radius: number;
  mass: number;
  speed: number;
  x: number;     // Left
  y: number;     // Top
  vx: number;
  vy: number;
  flowPoints: PointTuple[];
  flowTargetIdx: number;
  isDespawning: boolean;
  despawnTarget?: PointTuple;
}

// Global array to hold the active physics particles
let particles: ActiveParticle[] = [];

// ==========================================
// EXPORTED TRIGGER FUNCTIONS
// ==========================================

export const spawnParticle = (
  id: string | number, 
  speed: number, 
  radius: number, 
  density: number, 
  flowPoints: PointTuple[]
) => {
  if (flowPoints.length === 0) return;

  const startY = flowPoints[0][0]; // Top
  const startX = flowPoints[0][1]; // Left
  
  // Calculate Mass (prevent division by zero later)
  const mass = Math.max(0.1, radius * density); 

  // Determine initial velocity vector. Point it towards the second point if it exists.
  let initialVx = 0;
  let initialVy = 0;

  if (flowPoints.length > 1) {
    const nextY = flowPoints[1][0];
    const nextX = flowPoints[1][1];
    const dist = Math.hypot(nextX - startX, nextY - startY) || 1;
    initialVx = ((nextX - startX) / dist) * speed;
    initialVy = ((nextY - startY) / dist) * speed;
  } 
    const angle = Math.random() * Math.PI * 2;
    initialVx += Math.cos(angle) * speed / 4;
    initialVy += Math.sin(angle) * speed / 4;

  particles.push({
    id,
    radius,
    mass,
    speed,
    x: startX,
    y: startY,
    vx: initialVx,
    vy: initialVy,
    flowPoints,
    flowTargetIdx: flowPoints.length > 1 ? 1 : 0,
    isDespawning: false
  });
  return id;
};

export const triggerDespawn = (targetTuple: PointTuple) => {
  particles.forEach((p) => {
    if (p) {
      p.isDespawning = true;
      p.despawnTarget = targetTuple;

      // Optional: Boost the speed slightly upon despawn trigger so it "zips" away
      p.speed *= 1.5;
    }
  });
};

// ==========================================
// COMPONENT DEFINITION
// ==========================================

export const AnimationOverlay: Component = () => {
  let canvasRef!: HTMLCanvasElement;
  let animationFrameId: number;

  const animate = () => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    // Keep canvas sized to the window dynamically
    if (canvasRef.width !== window.innerWidth || canvasRef.height !== window.innerHeight) {
      canvasRef.width = window.innerWidth;
      canvasRef.height = window.innerHeight;
    }

    // Clear previous frame
    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

    // Iterate backwards so we can safely splice out despawned particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      let targetX: number;
      let targetY: number;

      // 1. Determine Target
      if (p.isDespawning && p.despawnTarget) {
        targetY = p.despawnTarget[0];
        targetX = p.despawnTarget[1];
        
        // If it gets close enough to the despawn point, kill it
        if (Math.hypot(targetX - p.x, targetY - p.y) < p.speed + p.radius) {
          particles.splice(i, 1);
          continue;
        }
      } else {
        targetY = p.flowPoints[p.flowTargetIdx][0];
        targetX = p.flowPoints[p.flowTargetIdx][1];
        
        // If it reaches the current flow point, cycle to the next one
        if (Math.hypot(targetX - p.x, targetY - p.y) < p.radius + 20) {
          p.flowTargetIdx = (p.flowTargetIdx + 1) % p.flowPoints.length;
        }
      }

      // 2. Physics & Steering Math
      const dx = targetX - p.x;
      const dy = targetY - p.y;
      const distance = Math.hypot(dx, dy) || 1;

      // Desired velocity is straight towards the target at max speed
      const desiredVx = (dx / distance) * p.speed;
      const desiredVy = (dy / distance) * p.speed;

      // Steering force is the difference between desired and current velocity
      const steerX = desiredVx - p.vx;
      const steerY = desiredVy - p.vy;

      // Acceleration = Force / Mass. 
      // (We multiply mass by a small constant so the turning feels smooth on screen)
      const ax = steerX / (p.mass);
      const ay = steerY / (p.mass);

      p.vx += ax;
      p.vy += ay;

      // Cap the velocity at the particle's speed limit
      const currentSpeed = Math.hypot(p.vx, p.vy);
      if (currentSpeed > p.speed) {
        p.vx = (p.vx / currentSpeed) * p.speed;
        p.vy = (p.vy / currentSpeed) * p.speed;
      }

      // Apply velocity to position
      p.x += p.vx;
      p.y += p.vy;

      // 3. Draw the Particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      
      // Makes it glow!
      ctx.shadowBlur = p.radius; 
      ctx.shadowColor = p.isDespawning ? '#00ff7f' : '#ffff00'; // Changes color when arcing to despawn
      ctx.fill();
      ctx.closePath();
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  onMount(() => {
    animate();
  });

  onCleanup(() => {
    cancelAnimationFrame(animationFrameId);
  });

  return (
    <canvas
      ref={canvasRef}
      style={{
        'background-color': 'transparent',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        'pointer-events': 'none',
        'z-index': 9999
      }}
    />
  );
};
