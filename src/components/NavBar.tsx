import { type Component } from 'solid-js';
import {
  userMode,
} from '../store';

export const NavBar: Component = () => {

  return (
      <div class='finger'>
        <div class='knuckle flex-down'>
          <button style={{
            'flex-grow': '1'
          }}>
            {userMode()}
          </button>
        </div>
        <div class='nail flex-wide'>
          <button class={userMode() === 'FocusWrite' ? 'hidden' : ''}>
            FocusWrite
          </button>
          <button class={userMode() === 'ReadWrite' ? 'hidden' : ''}>
            ReadWrite
          </button>
          <button class={userMode() === 'ReadArrange' ? 'hidden' : ''}>
            ReadArrange
          </button>
          <button class={userMode() === 'SparkScrape' ? 'hidden' : ''}>
            SparkScrape
          </button>
        </div>
      </div>


  );
};
