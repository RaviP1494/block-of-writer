import './App.css'

import { createSignal, For, Show, Switch, Match } from 'solid-js';
import { type Component } from 'solid-js';
import { FocusWriter } from './components/FocusWriter';
import { 
  userMode, setUserMode, focusedStreamID, writerTargetID, setWriterTargetID, 
  focusedEntity, setFocusedEntity, inflectionOn, openChains,
  fileErrorMessage, setFileErrorMessage 
} from './store';
import { AnimationOverlay } from './components/AnimationOverlay';
import { WelcomeTitle } from './components/WelcomeTitle';
import { WritersHandBar } from './components/WritersHandBar';
import { ViewFocused } from './components/ViewFocused';
import { PersistHandBar } from './components/PersistHandBar';
import { InStreamFloaters } from './components/InStreamFloaters';
import { VSLister } from './components/VSLister';
import { StreamSelector } from './components/StreamSelector';
import { VSReadPicker } from './components/VSReadPicker';
import { SparkChainSelector } from './components/SparkChainSelector';
import { DisplayChain } from './components/DisplayChain';
import { InflectionPoint } from './components/InflectionPoint';
import { CreateNew } from './components/CreateNew';

export const [spawnDots, setSpawnDots] = createSignal(false);
export const [showSettings, setShowSettings] = createSignal(false);

const App: Component = () => {
  const toggleUserMode = () => {
    if (userMode() === 'Write') {
      const target = writerTargetID();
      if (target) {
        setFocusedEntity({ entityType: 'stream', refID: target });
      } else {
        setFocusedEntity(null);
      }
      setUserMode('Read');
    } else {
      const focused = focusedEntity();
      if (focused && focused.entityType === 'stream') {
        setWriterTargetID(focused.refID);
      } else {
        setWriterTargetID(null);
      }
      setUserMode('Write');
    }
  };

  return (
    <>
      <Show when={spawnDots()}>
        <AnimationOverlay />
      </Show>
      <div class='page-topper'>
        <div style={{ display: 'flex' }}>
          <Show when={userMode() === 'Write'}>
            <button onClick={() => setShowSettings(!showSettings())}>
              Settings
            </button>
          </Show>
        </div>
        <div style={{ display: 'flex' }}>
          <WelcomeTitle />
        </div>
        <div style={{ display: 'flex' }}>
          <PersistHandBar />
        </div>
      </div>
      <div class="background">
        <div style={{
          'grid-column': '1',
          'max-height': '100%',
        }}
          class='flex-down'
        />

        <div style={{
          'grid-column': '2',
          'max-height': '100%',
        }}
          class='flex-down'
        >
          <button 
            class="mode-toggle-btn"
            onClick={toggleUserMode}
            style={{
              background: 'transparent',
              border: '1px solid #00ff7f',
              color: '#00ff7f',
              padding: '0.2rem 1.2rem',
              'border-radius': '4px',
              cursor: 'pointer',
              'font-weight': 'bold',
              'margin-bottom': '0.5rem'
            }}
          >
            {userMode() === 'Write' ? 'Read' : 'Write'}
          </button>
          <VSLister />
          <Show when={userMode() === 'Write'}>
            <StreamSelector />
            <CreateNew of='stream' />
            <FocusWriter />
            <Show when={inflectionOn()}>
              <InflectionPoint />
            </Show>
          </Show>
          <Show when={userMode() === 'Read'}>
            <VSReadPicker />
            <ViewFocused />
          </Show>
        </div>

        <div style={{
          'grid-column': '3',
          'max-height': '100%',
        }}>
          <Show when={userMode() === 'Write'}>
            <div class='flex-down'
              style={{
                'justify-content': 'flex-start',
                'height': '100%',
                'overflow-y': 'auto'
              }}>

              <Switch>
                <Match when={focusedStreamID()}>
                  <ViewFocused />
                </Match>
                <Match when={writerTargetID()}>
                  <InStreamFloaters streamID={writerTargetID()} clickAct='focus' />
                </Match>
              </Switch>
            </div>
          </Show>
          <Show when={userMode() === 'Read'}>
            <div class='flex-down'
              style={{
                'justify-content': 'flex-start',
                'height': '100%',
                'overflow-y': 'auto',
                width: '100%'
              }}>
              <SparkChainSelector />
              <For each={openChains}>
                {(chainID) => (
                  <DisplayChain id={chainID} />
                )}
              </For>
            </div>
          </Show>
        </div>

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

      <Show when={showSettings()}>
        <div class="settings-overlay" onClick={() => setShowSettings(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <WritersHandBar />
          </div>
        </div>
      </Show>

      <Show when={fileErrorMessage()}>
        <div class="settings-overlay" onClick={() => setFileErrorMessage(null)}>
          <div
            class="writers-handbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '1.2rem',
              'text-align': 'center',
              width: '32ch',
              height: 'auto',
              border: '1px solid #ff4444',
              color: '#ffffff',
              'box-shadow': '0 4px 20px rgba(255, 68, 68, 0.4)',
              'z-index': '101'
            }}
          >
            <div style={{ color: '#ff6666', 'font-size': '1.3rem', 'font-weight': 'bold', 'margin-bottom': '0.5rem' }}>
              Notice
            </div>
            <div style={{ 'font-size': '1rem' }}>
              {fileErrorMessage()}
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};

export default App;
