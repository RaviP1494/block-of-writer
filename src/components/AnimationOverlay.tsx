import { type Component, onMount, onCleanup } from 'solid-js';
import { textWordCount } from '../store';

// We use [top, left] to match your tuple requirement
export type PointTuple = [number, number]; 


interface ActiveParticle {
  id: number;
  radius: number;
  mass: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravPts: PointTuple[];
  isDespawning: boolean;
  despawnTarget?: PointTuple;
}

// Global array to hold the active physics particles
let nextParticleID = 1;
let particles: ActiveParticle[] = [];
// ==========================================
// EXPORTED TRIGGER FUNCTIONS
// ==========================================

export const spawnParticle = (
  gravPts: PointTuple[],
  text: string, 
  timeSpan: number
) => {
  const mass = Math.log(text.length + 1) * 1500;
  const radius = Math.sqrt(text.length) + 3;
  const wordsPerSecond = textWordCount(text) / timeSpan;
  const initialVx = wordsPerSecond * 5;
  const initialVy = wordsPerSecond * (-5);

  console.log('id:' + nextParticleID + 
              ',density:' + ',radius:' +
              radius + ',mass:' + mass +
              ',x:' + ',y:' +
               ',vx:' + + initialVx +
              ',vy:' + initialVy);
              

  particles.push({
    id: nextParticleID++,
    radius,
    mass,
    x: window.innerWidth / 2,
    y: window.innerHeight,
    vx: initialVx,
    vy: initialVy,
    gravPts: gravPts,
    isDespawning: false
  });
  return nextParticleID;
};

export const triggerDespawn = (targetTuple: PointTuple) => {
  particles.forEach((p) => {
    if (p) {
      p.isDespawning = true;
      p.despawnTarget = targetTuple;

      p.mass *= 10;
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
    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

    // const streamList = document.querySelector('.streamlist');
    // const listRect = streamList?.getBoundingClientRect();
    // const leftBound = listRect!.left;
    // const topBound = listRect!.top;
    // const rightBound = listRect!.left + listRect!.width;
    // const botBound = listRect!.top + listRect!.height;;

    if (!particles.length) nextParticleID = 1;
     // Iterate backwards so we can safely splice out despawned particles
     for (let i = particles.length - 1; i >= 0; i--) {
       const p = particles[i];
       let gravPts: PointTuple[] = [];
   
       if (p.x < 0) p.vx = Math.abs(p.vx);
       else if (p.x > canvasRef.width) p.vx = Math.abs(p.vx) * (-1);
       if (p.y < 0) p.vy = Math.abs(p.vy);
       else if (p.y > canvasRef.height) p.vy = Math.abs(p.vy) * (-1);

       // 1. Determine Target
       if (p.isDespawning && p.despawnTarget) {
         gravPts = [p.despawnTarget];
    
         // If it gets close enough to the despawn point, kill it
         if (Math.hypot(gravPts[0][1] - p.x, gravPts[0][0] - p.y) < 50) {
           particles.splice(i, 1);
           continue;
         }
       } else {
         gravPts = p.gravPts;
       }

       let ax = 0;
       let ay = 0;
       gravPts.forEach((pt) => {
         const d = Math.max(Math.hypot(pt[1] - p.x, pt[0] - p.y), 40);
         ax += (p.mass / (d * d)) * ((pt[1] - p.x) / d);
         ay += (p.mass / (d * d)) * ((pt[0] - p.y) / d);
         
       });
       p.vx += ax; 
       p.vy += ay;

       p.vx = p.vx < 0 ? Math.max(p.vx, -20) : Math.min(p.vx, 20);
       p.vy = p.vy < 0 ? Math.max(p.vy, -20) : Math.min(p.vy, 20);

      p.x += p.vx;
      p.y += p.vy;

      // 3. Draw the Particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      
      // Makes it glow!
      ctx.shadowBlur = p.radius; 
      ctx.shadowColor = p.isDespawning ? '#008020' : '#000000'; // Changes color when arcing to despawn
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
