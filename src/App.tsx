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
import { DotView } from './components/DotView';

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
              <CreateNew of='streams' />
              <FocusWriter />
            </div>
            <div class='focus-right' style={{position: 'relative'}}>
              <DotView
              ent= {focusedEntity()} />
            </div>
          </Match>

          <Match
            when={userMode() === 'SparkScrape'}>
            <div class='focus multi-stream'>
              <For each={openFloaters}>
                {(floater) => (
                  <ViewAnyItem
                    ent= {floater}
                    innerClickMode='multi' />)}
              </For>
            </div>
            <div class='focus-right'>
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
