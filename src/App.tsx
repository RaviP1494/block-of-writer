import './App.css'

import { Show } from 'solid-js';
import { type Component } from 'solid-js';
import { HandBar } from './components/HandBar';
import { FocusWriter, focusedStreamID } from './components/FocusWriter';
import { FocusReader } from './components/FocusReader';
import { InflectionPoint } from './components/InflectionPoint';
import { userMode, inflectionOn, activeViewSpaceID } from './store';


const App: Component = () => {


  return (
    <>
    <div class="background-one">
      <HandBar />

        <Show when={true}>
          <div class='focus-writer'>
            <div class='focus-reader'>
            <Show when={focusedStreamID() || activeViewSpaceID()}>
              <FocusReader />
            </Show>
            </div>
            <FocusWriter />
            <div class='focus-inflection-point'>
            <Show when={inflectionOn()}>
              <InflectionPoint />
            </Show>
            </div>
          </div>
        </Show>

    </div>
    </>
  );
};

export default App;
