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
      }}
    >
      <For each={activeParticles()}>
        {(p) => (
          <circle 
            cx={`${p.x}%`} 
            cy={`${p.y}%`} 
            r="4" 
            fill={`rgb(${p.cR}, ${p.cR}, ${p.cB})`} 
            opacity="0.9"
          />
        )}
      </For>
    </svg>
  );
};
