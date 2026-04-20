import { type Component } from 'solid-js';
import {
  userMode,
} from '../store';

export const NavBar: Component = () => {

  return (
      <div 
      style={{'margin-top': '10px'}}
      class='finger'>
        <div class='knuckle flex-down'>
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
          style={{margin: '0 10px'}} 
          class={userMode() === 'ReadWrite' ? 'hidden' : ''}>
            ReadWrite
          </button>
          <button 
          style={{margin: '0 10px'}} 
          class={userMode() === 'ReadArrange' ? 'hidden' : ''}>
            ReadArrange
          </button>
          <button 
          style={{margin: '0 5px'}} 
          class={userMode() === 'SparkScrape' ? 'hidden' : ''}>
            SparkScrape
          </button>
        </div>
      </div>


  );
};
