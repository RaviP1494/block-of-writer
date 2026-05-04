import './App.css'

import { createSignal, Show } from 'solid-js';
import { type Component } from 'solid-js';
import { FocusWriter } from './components/FocusWriter';
import { userMode, activeViewSpaceID, focusedStreamID } from './store';
import { AnimationOverlay } from './components/AnimationOverlay';
import { WelcomeTitle } from './components/WelcomeTitle';
import { WritersHandBar } from './components/WritersHandBar';
import { ViewFocused } from './components/ViewFocused';
import { PersistHandBar } from './components/PersistHandBar';
import { VSListFloaters } from './components/VSListFloaters';
import { VSListStreams } from './components/VSListStreams';
import { InStreamFloaters } from './components/InStreamFloaters';
import { VSLister } from './components/VSLister';

export const [spawnDots, setSpawnDots] = createSignal(false);

const App: Component = () => {
  return (
    <>
      <Show when={spawnDots()}>
        <AnimationOverlay />
      </Show>
      <div class='page-topper'>
        <div style={{ display: 'flex' }}>
          <PersistHandBar />
        </div>
        <div style={{ display: 'flex' }}>
              <VSLister />
        </div>
        <div style={{ display: 'flex' }}>
        </div>
      </div>
      <div class="background">
        <WelcomeTitle />

        <Show when={userMode() === 'Write'}>
        <div style={{
            'grid-row': '1 / span 2', 'grid-column': '1',
            'max-height': '98dvh',
        }}>
            <div class='flex-down'
              style={{
                'justify-content': 'flex-start',
                'height': '100%',
                'overflow-y': 'auto'
              }}>
              <VSListStreams id={activeViewSpaceID()} clickAct='focus' />
              <Show when={focusedStreamID()} fallback={
                <VSListFloaters id
                  ={activeViewSpaceID()}
                  clickAct='focus' />
              }>
                <InStreamFloaters streamID={focusedStreamID()} clickAct='focus' />
              </Show>
            </div>
          </div>
          <div style={{
            'grid-column': '2', 'grid-row': '2'
          }}>
            <FocusWriter />
            <WritersHandBar />
          </div>
        </Show>

        <Show when={userMode() === 'WriteRead'}>
          <div style={{
            'grid-row': '1 / span 2', 'grid-column': '1',
            'max-height': '98dvh',
          }}>
            <div class='flex-down'
              style={{
                'justify-content': 'flex-start',
                'height': '100%',
                'overflow-y': 'auto'
              }}>
              <VSListStreams id={activeViewSpaceID()} clickAct='focus' />
              <Show when={focusedStreamID()} fallback={
                <VSListFloaters id
                  ={activeViewSpaceID()}
                  clickAct='focus' />
              }>
                <InStreamFloaters streamID={focusedStreamID()} clickAct='focus' />
              </Show>
            </div>
          </div>
          <div style={{
            'grid-column': '2', 'grid-row': '2'
          }}>
            <FocusWriter />
            <WritersHandBar />
          </div>
          <div style={{
            'grid-column': '3', 'grid-row': '1 / span 2',
            'max-height': '100%',
          }}
            class='flex-down'
          >
            <ViewFocused />
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
