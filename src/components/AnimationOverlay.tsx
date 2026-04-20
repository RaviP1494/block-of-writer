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
  gravX: number;
  gravY: number;
  isDespawning: boolean;
  despawnTarget?: PointTuple;
}

// Global array to hold the active physics particles
let nextParticleID = 1;
let particles: ActiveParticle[] = [];
// ==========================================
// EXPORTED TRIGGER FUNCTIONS
// ==========================================
const charGroups = ['qaz', 'wsx', 'edc', 'rfv','uh','bij','okn','plm'];

const charMap = new Int8Array(26).fill(-1); 

charGroups.forEach((group, index) => {
  for (let i = 0; i < group.length; i++) {
    charMap[group.charCodeAt(i) - 97] = index;
  }
});

export function getGroupIndexFast(char: string): number {
  if (!char) return -1;
  const code = char.toLowerCase().charCodeAt(char.length-1) - 97;
  
  // Ensure it's a standard letter between a and z
  if (code >= 0 && code <= 25) {
     return charMap[code] + 1;
  }
  return -1; // Character not in any group (like numbers, punctuation, or 't')
}
export const spawnParticle = (
  gravPoint: PointTuple,
  startPt: PointTuple,
  text: string, 
  timeSpan: number
) => {

  const mass = text.length;
  const radius = Math.sqrt(mass) + 5;

  const wordsPerSecond = textWordCount(text) / timeSpan;
  let initialVx = (Math.floor(Math.random() * 3) - 1) * wordsPerSecond * 10;
  let initialVy = (Math.floor(Math.random() * 3) - 1) * wordsPerSecond * 10;

  console.log('id:' + nextParticleID + ',density:' + ',radius:' + radius + ',mass:' + mass + ',x:' + startPt[1] + ',y:' + startPt[0] + ',vx:' + + initialVx + ',vy:' + initialVy + ',gravX:' + gravPoint[1] + ',gravY:' + gravPoint[0]);

  particles.push({
    id: nextParticleID++,
    radius,
    mass,
    x: gravPoint[1],
    y: gravPoint[0],
    vx: initialVx,
    vy: initialVy,
    gravX: gravPoint[1],
    gravY: gravPoint[0],
    isDespawning: false
  });
  return nextParticleID;
};

export const triggerDespawn = (targetTuple: PointTuple) => {
  particles.forEach((p) => {
    if (p) {
      p.isDespawning = true;
      p.despawnTarget = targetTuple;

      p.mass *= 1.5;
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

    if (!particles.length) nextParticleID = 1;
     // Iterate backwards so we can safely splice out despawned particles
     for (let i = particles.length - 1; i >= 0; i--) {
       const p = particles[i];
       let gravX: number;
       let gravY: number;
       let pull: number;
   
       if(p.x > canvasRef.width) p.vx = 0 - (Math.abs(p.vx) * 9 / 10);
       else if(p.x < 0) p.vx = Math.abs(p.vx * 9 / 10);
       if(p.y > canvasRef.height) p.vy = 0 - (Math.abs(p.vy) * 9 / 10);
       else if(p.y < 0) p.vy = Math.abs(p.vy * 9 / 10);

       // 1. Determine Target
       if (p.isDespawning && p.despawnTarget) {
         gravY = p.despawnTarget[0];
         gravX = p.despawnTarget[1];
         pull = p.mass * 300;
    
         p.radius -= .02;
         // If it gets close enough to the despawn point, kill it
         if (Math.hypot(gravX - p.x, gravY - p.y) < 140 || p.radius < 0.5) {
           particles.splice(i, 1);
           continue;
         }
       } else {
         gravX = p.gravX;
         gravY = p.gravY;
         pull = p.mass * 100;
       }

       const d = Math.max(Math.hypot(gravX - p.x, gravY - p.y), 0.1);
       const ax = Math.min(20,pull * p.x / (d * d * d));
       const ay = Math.min(20,pull * p.y / (d * d * d));


       // console.log('vx:' + p.vx + '+ax:(' + ax + ')vy:' + p.vy + '+ay:(' + ay + ')');
       p.vx += ax;
       p.vy += ay;

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
