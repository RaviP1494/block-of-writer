import './App.css'

import { createSignal, For, Match, Show, Switch } from 'solid-js';
import { type Component } from 'solid-js';
import { FocusWriter } from './components/FocusWriter';
import { userMode, focusedChainID, openStreams, focusedEntity } from './store';
import { AnimationOverlay } from './components/AnimationOverlay';
import { WelcomeTitle } from './components/WelcomeTitle';
import { WritersHandBar } from './components/WritersHandBar';
import { DisplayStream } from './components/DisplayStream';
import { DisplayChain } from './components/DisplayChain';
import { Lister } from './components/Lister';
import { SelectItem } from './components/SelectItem';
import { CreateNew } from './components/CreateNew';
import { ViewAnyItem } from './components/ViewAnyItem';

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

        <div class='handbar' style={{ display: 'flex' }}>
          <WritersHandBar />
        </div>

        <Switch>
          <Match
            when={userMode() === 'ReadWrite'}>
            <div class='focus-left'>
              <SelectItem
                of='viewspace'
                clickAct='focus' />
            </div>
            <div class='focus'>
              <CreateNew of='streams' />
              <FocusWriter />
            </div>
            <div class='focus-right flex-down'
             style={{'align-items': 'center'}}>
              <ViewAnyItem
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
            <div class='focus-left flex-down'>
            <SelectItem of='viewspace' clickAct='focus' />
            </div>
            <div class='focus'>
            {focusedEntity()?.refID + ': ' + focusedEntity()?.entityType}
            </div>
            <div class='focus-right flex-down'>
            <SelectItem of='space-floaters' clickAct='focus' />
            </div>
          </Match>
        </Switch>

      </div>
    </>
  );
};

export default App;
