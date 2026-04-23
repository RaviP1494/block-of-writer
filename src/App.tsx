import './App.css'

import { createSignal, For, Match, Show, Switch } from 'solid-js';
import { type Component } from 'solid-js';
import { FocusWriter } from './components/FocusWriter';
import { focusedStreamID, userMode, focusedChainID, showStats, openStreams } from './store';
import { AnimationOverlay } from './components/AnimationOverlay';
import { WelcomeTitle } from './components/WelcomeTitle';
import { WritersHandBar } from './components/WritersHandBar';
import { DisplayStream } from './components/DisplayStream';
import { DisplayChain } from './components/DisplayChain';
import { DisplayStats } from './components/DisplayStats';
import { DisplaySpace } from './components/DisplaySpace';
import { Lister } from './components/Lister';

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

        <div class='handbar' style={{display: 'flex'}}>
            <WritersHandBar />
            </div>
        <Switch>
          <Match 
          when={userMode() === 'ReadWrite'}>

            <div class='focus-left'>
              <Lister 
              of='streams' 
              clickAct='focus' />
            </div>

            <div class='focus'>
            <FocusWriter />
            </div>

            <div class='focus-right'>
              <DisplayStream 
              id={focusedStreamID()} 
              innerClickMode='focus' />
            </div>
          </Match>

          <Match 
          when={userMode() === 'SparkScrape'}>
            <div class='focus-left'>
              <Lister 
              of='streams' 
              clickAct='multi' />
            </div>

            <div class='focus multi-stream'>
              <For each={openStreams}>
                {(id) => (
                  <DisplayStream 
                  id={id} 
                  innerClickMode='chain' />)}
              </For>
            </div>

            <div class='focus-right'>
              <Lister 
              of='chains' 
              clickAct='focus' />
              <DisplayChain 
              id={focusedChainID()} />
            </div>
          </Match>

          <Match when={userMode() === 'ReadArrange'}>

            <div class='focus-left'>
            <div 
            style={{color: '#ff0000'}}
            class='flex-top-down'>
              <Show when={showStats()}>
                <DisplayStats />
              </Show>
              </div>
              <DisplaySpace id={1} />
            </div>

            <div class='focus multi-stream'>
              <Lister 
              of='streams' 
              clickAct='multi' />
              <For each={openStreams}>
                {(id) => (
                  <DisplayStream 
                  id={id} 
                  innerClickMode='chain' />)}
              </For>
            </div>

            <div class='focus-right'>
              <Lister 
              of='chains' 
              clickAct='focus' />
              <DisplayChain 
              id={focusedChainID()} />
            </div>

          </Match>
        </Switch>

      </div>
    </>
  );
};

export default App;
