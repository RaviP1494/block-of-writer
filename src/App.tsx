import './App.css'

import { createSignal, Show } from 'solid-js';
import { type Component } from 'solid-js';
import { FocusWriter } from './components/FocusWriter';
import { FocusReader } from './components/FocusReader';
import { userMode } from './store';
import { AnimationOverlay } from './components/AnimationOverlay';
import { StreamList } from './components/StreamList';
import { WelcomeTitle } from './components/WelcomeTitle';
import { WritersHandBar } from './components/WritersHandBar';

export const [spawnDots, setSpawnDots] = createSignal(true);

const App: Component = () => {


  return (
    <>
    <Show when={spawnDots()}>
      <AnimationOverlay />
    </Show>
      <div class="background-one">
      <WelcomeTitle />
      <WritersHandBar />

        <Show when={userMode() === 'ReadWrite'}>
          <div class='focus-left flex-down' 
          style={{'justify-content': 'flex-end'}}>
          <StreamList clickDo={true} />
          </div>
          <FocusWriter />
          <FocusReader />
        </Show>

      </div>
    </>
  );
};

export default App;
