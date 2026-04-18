import './App.css'

import { Show } from 'solid-js';
import { type Component } from 'solid-js';
import { HandBar } from './components/HandBar';
import { FocusWriter } from './components/FocusWriter';
import { FocusReader } from './components/FocusReader';
import { userMode } from './store';
import { AnimationOverlay } from './components/AnimationOverlay';


const App: Component = () => {


  return (
    <>
      <AnimationOverlay />
      <div class="background-one">
        <HandBar />

        <Show when={userMode() === 'ReadWrite'}>
          <div class='focus-left'>
            <FocusReader />
          </div>
          <FocusWriter />
        </Show>

      </div>
    </>
  );
};

export default App;
