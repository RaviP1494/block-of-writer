import { type Component } from 'solid-js';
import { setSpawnDots, spawnDots } from '../App';

export const WelcomeTitle: Component = () => {
  return (
    <div class='grav-pt'>
      <span 
      onClick={()=>setSpawnDots(!spawnDots())} 
      title='click for weird dots on flickering flashes'
      style={{
        'text-shadow': spawnDots() ? '-2px 0 10px #ff0000' : 'inherit',
        'font-family': "'Syne Mono', monospace",
        'color': '#ffffff'
      }}>
        Writer's Block
      </span>
    </div>
  );
}
