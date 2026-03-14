// src/components/AnimationOverlay.tsx
import { type Component, For } from 'solid-js';
import { activeParticles } from '../store';

export const AnimationOverlay: Component = () => {
  return (
    <svg 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        "pointer-events": 'none', /* Crucial: lets clicks pass through */
        "z-index": 9999           /* Always on top */
      }}
    >
      <For each={activeParticles()}>
        {(p) => (
          <circle 
            cx={`${p.x}%`} 
            cy={`${p.y}%`} 
            r="4" 
            fill="#4a90e2" /* Fun blue color */
            opacity="0.6"
          />
        )}
      </For>
    </svg>
  );
};
