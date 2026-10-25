import './App.css'
import { type Component, createSignal, Show } from 'solid-js';
import { FocusWriter } from './components/FocusWriter';
import { VSLister, vsDisplayMode } from './components/VSLister';
import { ViewFocused } from './components/ViewFocused';
import { ViewMultItems } from './components/ViewMultItems';
import { InflectionPoint } from './components/InflectionPoint';
import { SuspenBar } from './components/SuspenBar';
import {
  saveToFile,
  loadFromFile,
  fileErrorMessage,
  openFloaters,
  userMode,
  setUserMode,
  inflectionOn,
} from './store';
export const [spawnDots, setSpawnDots] = createSignal(false);
export const [appTheme, setAppTheme] = createSignal<'space' | 'reef'>('space');


const App: Component = () => {
  const [saveStatus, setSaveStatus] = createSignal<string | null>(null);

  const toggleTheme = () =>
    setAppTheme((prev) => (prev === 'space' ? 'reef' : 'space'));

  const handleSave = async () => {
    setSaveStatus('Saving...');
    const ok = await saveToFile();
    if (ok) {
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(null), 2000);
    } else {
      setSaveStatus(null);
    }
  };

  const handleLoad = async () => {
    await loadFromFile();
  };

  return (
    <>
      <Show when={fileErrorMessage()}>
        <div class="wb-toast-error" role="alert">
          {fileErrorMessage()}
        </div>
      </Show>

      <div
        class="wb-app"
        data-theme={appTheme()}
        data-mode={userMode().toLowerCase()}
        data-vs-grid={vsDisplayMode() === 'grid' ? 'open' : 'closed'}
        data-companion={
          vsDisplayMode() === 'active' && userMode() === 'Write' && openFloaters.length > 0
            ? 'open'
            : 'closed'
        }
      >

        <header class="wb-navbar" role="banner">
          <div class="wb-navbar__left">
            <button 
              type="button" 
              class="wb-navbar__btn" 
              onClick={handleSave}
              title="Save session to file"
            >
              {saveStatus() || 'Save'}
            </button>
            <button 
              type="button" 
              class="wb-navbar__btn" 
              onClick={handleLoad}
              title="Load session or stream from file"
            >
              Load
            </button>
          </div>

          <h1 class="wb-navbar__brand">Writers Block</h1>
          <div class="wb-navbar__right">
            <nav aria-label="Workspace Mode" class="wb-mode-ReadRecollect">
              <button
                type="button"
                class="wb-navbar__btn"
                classList={{ 'wb-navbar__btn--active': userMode() === 'Write' }}
                onClick={() => setUserMode('Write')}
              >
                Write
              </button>
              <button
                type="button"
                class="wb-navbar__btn"
                classList={{ 'wb-navbar__btn--active': userMode() === 'Read' }}
                onClick={() => setUserMode('Read')}
              >
                Review
              </button>
              <button type="button" class="wb-ghost-slot" onClick={toggleTheme}>
                {appTheme() === 'space' ? '✦ Space' : '≈ Reef'}
              </button>
            </nav>
            <button type="button" class="wb-ghost-slot"><s>Settings</s></button>
            <button type="button" class="wb-ghost-slot"><s>Account</s></button>
          </div>
        </header>

        <section class="wb-context-deck" aria-label="View Space and Stream Selectors">
          <VSLister />
        </section>

        <Show when={vsDisplayMode() === 'active'}>
          <div class="wb-workspace">

            <main class="wb-stage" id="focal-stage" tabindex="-1">
              <Show
                when={userMode() === 'Write'}
                fallback={
                  <article class="wb-focal-chamber wb-focal-chamber--reader" data-measure="narrow">
                    <ViewFocused innerClickMode="focus" />
                  </article>
                }
              >
                <article class="wb-focal-chamber" data-measure="wide">
                  <FocusWriter />
                </article>

                <Show when={inflectionOn()}>
                  <section class="wb-inflection-slot" aria-label="Inflection Point">
                    <InflectionPoint />
                  </section>
                </Show>
              </Show>
            </main>

            <aside class="wb-companion-bay" aria-label="Companion Streams and Stractors">
              <div class="wb-companion-track">
                <ViewMultItems innerClickMode="multi" />
              </div>
            </aside>

          </div>
        </Show>

        <aside class="wb-suspension-bar" aria-label="Suspension Bar for items in transit">
          <SuspenBar />
        </aside>

      </div>
    </>
  );
}

export default App;
