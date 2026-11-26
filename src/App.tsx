import './App.css'
import { type Component, batch, createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { FocusWriter, isActiveTimer } from './components/FocusWriter';
import { VSLister, vsDisplayMode } from './components/VSLister';
import { FocusViewer } from './components/FocusViewer';
import { ViewMultItems } from './components/ViewMultItems';
import { InflectionPoint } from './components/InflectionPoint';
import { SuspenBar } from './components/SuspenBar';
import { SeedModal } from './components/SeedModal';
import { SettingsModal } from './components/SettingsModal';
import {
  saveToFile,
  loadFromFile,
  manualSaveApp,
  loadSavedApp,
  fileErrorMessage,
  openFloaters,
  userMode,
  setUserMode,
  inflectionOn,
  writerTargetID,
  getStream,
  viewSpaces,
  activeViewSpaceID,
  setFocusedEntity,
  setFocusedStreamID,
  focusedEntity,
  focusedStreamID,
  allFlashes,
  allFlickers,
  allStreams,
  suspenBarTents,
  sparkChains,
  flashDelayT,
  flickerDelayT,
  flickerModeOn,
  backspaceDisabled,
} from './store';
export const [spawnDots, setSpawnDots] = createSignal(false);
export const [appTheme, setAppTheme] = createSignal<'space' | 'reef'>('space');


const App: Component = () => {
  const [saveStatus, setSaveStatus] = createSignal<string | null>(null);
  const [showSettings, setShowSettings] = createSignal(false);
  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false);
  const [dbReady, setDbReady] = createSignal(false);
  let mobileMenuRef: HTMLDivElement | undefined;

  onMount(async () => {
    await loadSavedApp();
    setDbReady(true);

    const flushToDB = () => {
      if (dbReady()) void manualSaveApp();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushToDB();
    };
    const handleDocClick = (e: MouseEvent) => {
      if (!mobileMenuOpen()) return;
      if (
        mobileMenuRef &&
        !mobileMenuRef.contains(e.target as Node) &&
        !e.composedPath().includes(mobileMenuRef)
      ) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen()) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('beforeunload', flushToDB);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('click', handleDocClick);
    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      window.removeEventListener('beforeunload', flushToDB);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('click', handleDocClick);
      window.removeEventListener('keydown', handleKeyDown);
    });
  });

  createEffect(() => {
    if (isActiveTimer() && mobileMenuOpen()) {
      setMobileMenuOpen(false);
    }
  });

  // Debounced per-session IndexedDB auto-save (contents + Write-mode memory + settings)
  let saveDebounceTimer: number | undefined;
  createEffect(() => {
    if (!dbReady()) return;

    // Subscribe to reactive structural changes across stores and session state
    void allFlashes.length;
    void allFlickers.map((b) => b.contentIDs.length);
    void allStreams.map((s) => `${s.id}:${s.title}:${s.contentIDs.length}`);
    void viewSpaces.map((vs) => `${vs.id}:${vs.title}:${vs.tentsInSpace.length}`);
    void suspenBarTents.map((e) => `${e.entityType}:${e.refID}`);
    void sparkChains.map((c) => `${c.id}:${c.title}:${c.sparkIDs.length}`);
    void openFloaters.map((e) => `${e.entityType}:${e.refID}`);
    void activeViewSpaceID();
    void writerTargetID();
    void focusedEntity();
    void focusedStreamID();
    void flashDelayT();
    void flickerDelayT();
    void flickerModeOn();
    void backspaceDisabled();
    void inflectionOn();

    if (saveDebounceTimer) window.clearTimeout(saveDebounceTimer);
    saveDebounceTimer = window.setTimeout(() => {
      void manualSaveApp();
    }, 400);
  });

  onCleanup(() => {
    if (saveDebounceTimer) window.clearTimeout(saveDebounceTimer);
  });

  const toggleTheme = () =>
    setAppTheme((prev) => (prev === 'space' ? 'reef' : 'space'));

  const handleEnterReviewMode = () => {
    batch(() => {
      const targetID = writerTargetID();
      if (targetID !== null && getStream(targetID)) {
        setFocusedStreamID(targetID);
        setFocusedEntity({ entityType: 'stream', refID: targetID });
      } else {
        const activeVS = viewSpaces.find((vs) => vs.id === activeViewSpaceID());
        const tents = activeVS?.tentsInSpace || [];
        const lastEnt = tents.length > 0 ? tents[tents.length - 1] : null;
        if (lastEnt) {
          setFocusedStreamID(lastEnt.entityType === 'stream' ? lastEnt.refID : 0);
          setFocusedEntity({ entityType: lastEnt.entityType, refID: lastEnt.refID });
        } else {
          setFocusedStreamID(0);
          setFocusedEntity(null);
        }
      }
      setUserMode('Read');
    });
  };

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
        data-generating={isActiveTimer() ? 'true' : 'false'}
        data-companion="closed"
      >
        <SeedModal />
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

        <header class="wb-navbar" role="banner">
          <div class="wb-navbar__left">
            <button 
              type="button" 
              class="wb-navbar__btn" 
              disabled={isActiveTimer()}
              onClick={handleSave}
              title="Save session to file"
            >
              {saveStatus() || 'Save'}
            </button>
            <button 
              type="button" 
              class="wb-navbar__btn" 
              disabled={isActiveTimer()}
              onClick={handleLoad}
              title="Load session or stream from file (adds to current session)"
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
                disabled={isActiveTimer()}
                onClick={() => setUserMode('Write')}
              >
                Write
              </button>
              <button
                type="button"
                class="wb-navbar__btn"
                classList={{ 'wb-navbar__btn--active': userMode() === 'Read' }}
                disabled={isActiveTimer()}
                onClick={handleEnterReviewMode}
              >
                Review
              </button>
            </nav>

            <div class="wb-navbar__desktop-actions">
              <button
                type="button"
                class="wb-ghost-slot"
                disabled={isActiveTimer()}
                onClick={toggleTheme}
              >
                Theme: {appTheme() === 'space' ? '✦ Space' : '≈ Reef'}
              </button>
              <button
                type="button"
                class="wb-navbar__btn"
                classList={{ 'wb-navbar__btn--active': showSettings() }}
                disabled={isActiveTimer()}
                onClick={() => setShowSettings((prev) => !prev)}
                title="Open Writer Settings"
              >
                Settings
              </button>
              <button type="button" class="wb-ghost-slot" disabled={isActiveTimer()}><s>Account</s></button>
            </div>

            <div class="wb-navbar__mobile-menu-wrap" ref={mobileMenuRef}>
              <button
                type="button"
                class="wb-navbar__hamburger"
                classList={{ 'wb-navbar__btn--active': mobileMenuOpen() }}
                disabled={isActiveTimer()}
                aria-expanded={mobileMenuOpen()}
                aria-haspopup="menu"
                aria-label="Open menu"
                title="Menu"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
              >
                <Show
                  when={!mobileMenuOpen()}
                  fallback={
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    </svg>
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </Show>
              </button>

              <Show when={mobileMenuOpen()}>
                <div class="wb-mobile-menu" role="menu" aria-label="Navigation Menu">
                  <div class="wb-mobile-menu__brand">Writers Block</div>

                  <button
                    type="button"
                    role="menuitem"
                    class="wb-mobile-menu__item"
                    disabled={isActiveTimer()}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void handleSave();
                    }}
                  >
                    {saveStatus() || 'Save'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    class="wb-mobile-menu__item"
                    disabled={isActiveTimer()}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void handleLoad();
                    }}
                  >
                    Load
                  </button>

                  <div class="wb-mobile-menu__divider" role="separator" />

                  <button
                    type="button"
                    role="menuitem"
                    class="wb-mobile-menu__item"
                    disabled={isActiveTimer()}
                    onClick={toggleTheme}
                  >
                    Theme: {appTheme() === 'space' ? '✦ Space' : '≈ Reef'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    class="wb-mobile-menu__item"
                    classList={{ 'wb-mobile-menu__item--active': showSettings() }}
                    disabled={isActiveTimer()}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowSettings((prev) => !prev);
                    }}
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    class="wb-mobile-menu__item wb-mobile-menu__item--ghost"
                    disabled={isActiveTimer()}
                  >
                    <s>Account</s>
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </header>

        <Show when={vsDisplayMode() === 'grid'}>
          <section class="wb-context-deck wb-context-deck--grid" aria-label="View Space Directory">
            <VSLister mode="grid" />
          </section>
        </Show>

        {/* Keep workspace mounted while ViewSpace Selection is open so active writing & timers continue */}
        <div
          class="wb-workspace"
          classList={{ 'wb-workspace--hidden': vsDisplayMode() === 'grid' }}
        >
          <section
            class="wb-context-deck"
            aria-label={userMode() === 'Write' ? 'View Space and Stream Selectors' : 'View Space and Item Selectors'}
          >
            <VSLister mode="bar" />
          </section>

          <Show
            when={userMode() === 'Write'}
            fallback={
              <main class="wb-stage" id="focal-stage" tabindex="-1">
                <article class="wb-focal-chamber wb-focal-chamber--reader" data-measure="narrow">
                  <FocusViewer innerClickMode="focus" />
                </article>
              </main>
            }
          >
            <main class="wb-stage" id="focal-stage" tabindex="-1">
              <article class="wb-focal-chamber" data-measure="wide">
                <FocusWriter />
              </article>

              <Show when={inflectionOn()}>
                <section class="wb-inflection-slot" aria-label="Inflection Point">
                  <InflectionPoint />
                </section>
              </Show>
            </main>

            <Show when={openFloaters.length > 0}>
              <section class="wb-reader-stack" aria-label="Open Streams and Floating Items">
                <ViewMultItems innerClickMode="multi" />
              </section>
            </Show>
          </Show>
        </div>

        <aside class="wb-suspension-bar" aria-label="Suspension Bar for items in transit">
          <SuspenBar />
        </aside>

      </div>
    </>
  );
}

export default App;
