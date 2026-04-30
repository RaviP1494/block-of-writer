import './App.css'

import { createSignal, Show } from 'solid-js';
import { type Component } from 'solid-js';
import { FocusWriter } from './components/FocusWriter';
import { userMode, focusedEntity, activeViewSpaceID } from './store';
import { AnimationOverlay } from './components/AnimationOverlay';
import { WelcomeTitle } from './components/WelcomeTitle';
import { WritersHandBar } from './components/WritersHandBar';
import { CreateNew } from './components/CreateNew';
import { ViewFocused } from './components/ViewFocused';
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


        <Show when={userMode() === 'ReadWrite'}>
          <FocusWriter />
          <div style={{
            'grid-column': '1',
            'grid-row': '2'
          }}>
            <CreateNew of='stream' />
            <VSListStreams id={activeViewSpaceID()} clickAct='focus' />
          </div>
          <div class='flex-down' style={{
            'max-height': '100%',
            'grid-column': '3',
            'grid-row': '2',
          }}>
          <Show when={focusedEntity()} fallback={
              <VSListFloaters id
                ={activeViewSpaceID()}
                clickAct='focus' />
            }>
              <ViewFocused
                innerClickMode=
                'focus' />
            </Show>
          </div>
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
