import { type Component } from 'solid-js';
import {
    setUserMode,
  userMode,
} from '../store';

export const NavBar: Component = () => {

  return (
      <div 
      class='finger navbar'>
        <div class='knuckle'>
          <button style={{
            'flex-grow': '1'
          }}>
            {userMode()}
          </button>
        </div>
        <div 
        class='nail flex-wide'>
          <button 
          class={userMode() === 'FocusWrite' ? 'hidden' : ''}>
            FocusWrite
          </button>
          <button 
          onClick={()=>setUserMode('ReadWrite')}
          class={userMode() === 'ReadWrite' ? 'hidden' : ''}>
            ReadWrite
          </button>
          <button 
          onClick={()=>setUserMode('ReadArrange')}
          class={userMode() === 'ReadArrange' ? 'hidden' : ''}>
            ReadArrange
          </button>
          <button 
          onClick={()=>setUserMode('SparkScrape')}
          class={userMode() === 'SparkScrape' ? 'hidden' : ''}>
            SparkScrape
          </button>
        </div>
      </div>
  );
};
