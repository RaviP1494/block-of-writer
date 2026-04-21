import './App.css'

import { createSignal, For, Match, Show, Switch } from 'solid-js';
import { type Component } from 'solid-js';
import { FocusWriter } from './components/FocusWriter';
import { focusedStreamID, userMode, focusedChainID, chainAttStreamIDs } from './store';
import { AnimationOverlay } from './components/AnimationOverlay';
import { StreamList } from './components/StreamList';
import { WelcomeTitle } from './components/WelcomeTitle';
import { WritersHandBar } from './components/WritersHandBar';
import { DisplayStream } from './components/DisplayStream';
import { DisplayChain } from './components/DisplayChain';
import { ChainList } from './components/ChainList';

export const [spawnDots, setSpawnDots] = createSignal(false);

const App: Component = () => {


  return (
    <>
      <Show when={spawnDots()}>
        <AnimationOverlay />
      </Show>
      <div class="background-one">
        <div class='title'>
          <WelcomeTitle />
        </div>

        <Switch>
          <Match when={userMode() === 'ReadWrite'}>

            <WritersHandBar />

            <div class='focus-left'>
              <StreamList clickDo='focus' />
            </div>

            <FocusWriter />

            <div class='focus-right'>
              <DisplayStream id={focusedStreamID()} innerClickMode='focus' />
            </div>
          </Match>


          <Match when={userMode() === 'SparkScrape'}>
            <div class='focus-left'>
              <StreamList clickDo='sparkcatch' />
            </div>

            <div class='focus multi-stream'>
              <For each={chainAttStreamIDs}>
                {(id) => (
                  <DisplayStream id={id} innerClickMode='chain' />)}
              </For>
            </div>

            <div class='focus-right'>
              <ChainList clickDo='focus' />
              <DisplayChain id={focusedChainID()} />
            </div>
          </Match>
        </Switch>

      </div>
    </>
  );
};

export default App;
