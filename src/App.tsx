import './App.css'

import { createSignal, For, Match, Show, Switch } from 'solid-js';
import { type Component } from 'solid-js';
import { FocusWriter } from './components/FocusWriter';
import { userMode, focusedChainID, focusedEntity, openFloaters, activeViewSpaceID } from './store';
import { AnimationOverlay } from './components/AnimationOverlay';
import { WelcomeTitle } from './components/WelcomeTitle';
import { WritersHandBar } from './components/WritersHandBar';
import { DisplayChain } from './components/DisplayChain';
import { SelectItem } from './components/SelectItem';
import { CreateNew } from './components/CreateNew';
import { ViewAnyItem } from './components/ViewAnyItem';
import { SelectChain } from './components/SelectChain';
import { PersistHandBar } from './components/PersistHandBar';
import { VSListFloaters } from './components/VSListFloaters';
import { VSListStreams } from './components/VSListStreams';

export const [spawnDots, setSpawnDots] = createSignal(false);

const App: Component = () => {

  return (
    <>
      <Show when={spawnDots()}>
        <AnimationOverlay />
      </Show>
      <div class="background">
      <WelcomeTitle />
        <div class='handbar'>
          <PersistHandBar />
          <Show when={userMode() === 'ReadWrite'}>
            <WritersHandBar />
          </Show>
        </div>


        <div style={{'max-height': '100%'}}>
          <VSListStreams id={activeViewSpaceID()} clickAct='focus' />
          <CreateNew of='stream'/>
        </div>
        <Show when={userMode() === 'ReadWrite'}>
          <FocusWriter />
        <VSListFloaters id={activeViewSpaceID()} clickAct='ope' />
        <ViewAnyItem ent={focusedEntity()} innerClickMode='focus' />
        </Show>
{/*     <Switch>
          <Match
            when={userMode() === 'ReadWrite'}>
            <div class='handbar' 
            style={{ display: 'flex' }}>
              <WritersHandBar />
            </div>
            <div class='focus-left flex-down'>
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
        */}

      </div>
    </>
  );
};

export default App;
