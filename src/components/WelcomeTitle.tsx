import { type Component } from 'solid-js';
import { NavBar } from './NavBar';
import { setSpawnDots, spawnDots } from '../App';

export const WelcomeTitle: Component = () => {
  return (
    <div class='welcomer'>
      <h1 
      onClick={()=>setSpawnDots(!spawnDots())} 
      title='click for weird dots on flickering flashes'
      style={{
        'margin-top': '10px',
        'text-shadow': spawnDots() ? '-2px 0 10px #ff0000' : 'inherit',
        width: '8ch'
      }}>
        Writer's Block
      </h1>
      <NavBar />
    </div>
  );
}
