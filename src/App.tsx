import './App.css'

import { Show } from 'solid-js';
import { type Component } from 'solid-js';
import { HandBar } from './components/HandBar';
import { FocusWriter } from './components/FocusWriter';
import { FocusReader } from './components/FocusReader';
import { InflectionPoint } from './components/InflectionPoint';
import { userMode, inflectionOn } from './store';


const App: Component = () => {


  return (
    <>
      <div class="background-one">
        <HandBar />

        <div class='contents'>
          <Show when={userMode() === 'ReadWrite'}>
            <div class='focus-side reader'>
              <FocusReader />
            </div>
            <FocusWriter />
            <div class='focus-side flex-dlist'>
              <Show when={inflectionOn()}>
                <InflectionPoint />
              </Show>
            </div>
          </Show>

        </div>
      </div>
    </>
  );
};

export default App;
