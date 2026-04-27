import './App.css'

import { createSignal, For, Match, Show, Switch } from 'solid-js';
import { type Component } from 'solid-js';
import { FocusWriter } from './components/FocusWriter';
import { userMode, focusedChainID, focusedEntity, openFloaters } from './store';
import { AnimationOverlay } from './components/AnimationOverlay';
import { WelcomeTitle } from './components/WelcomeTitle';
import { WritersHandBar } from './components/WritersHandBar';
import { DisplayChain } from './components/DisplayChain';
import { SelectItem } from './components/SelectItem';
import { CreateNew } from './components/CreateNew';
import { ViewAnyItem } from './components/ViewAnyItem';
import { SelectChain } from './components/SelectChain';

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
          <Match
            when={userMode() === 'ReadWrite'}>
            <div class='handbar' 
            style={{ display: 'flex' }}>
              <WritersHandBar />
            </div>
            <div class='focus-left'>
              <SelectItem
                of='viewspace'
                clickAct='focus' />
            </div>
            <div class='focus'>
              <CreateNew of='stream' />
              <FocusWriter />
            </div>
            <div class='focus-right'>
            <ViewAnyItem ent={focusedEntity()} innerClickMode='focus' />
            </div>
          </Match>

          <Match
            when={userMode() === 'SparkScrape'}>
            <div class='focus-left'>
            <SelectItem of='viewspace' clickAct='multi' />
            </div>
            <div class='focus multi-stream'>
              <For each={openFloaters}>
                {(floater) => (
                  <ViewAnyItem
                    ent= {floater}
                    innerClickMode='multi' />)}
              </For>
            </div>
            <div class='focus-right'>
            <SelectChain clickAct='focus' />
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
