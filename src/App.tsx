import './App.css'
import { type Component, Match, Show, Switch, batch, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { FocusWriter, isActiveTimer } from './components/FocusWriter';
import { VSLister, vsDisplayMode } from './components/VSLister';
import { FocusViewer } from './components/FocusViewer';
import { ViewMultItems } from './components/ViewMultItems';
import { InflectionPoint } from './components/InflectionPoint';
import { SuspenBar } from './components/SuspenBar';
import { SeedModal } from './components/SeedModal';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import {
  saveToFile,
  loadFromFile,
  manualSaveApp,
  loadSavedApp,
  fileErrorMessage,
  openFloaters,
  setOpenFloaters,
  writeOpenItem,
  userMode,
  setUserMode,
  inflectionOn,
  writerTargetID,
  getStream,
  viewSpaces,
  activeViewSpaceID,
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

const HELP_SEEN_KEY = 'wb_help_seen';

const App: Component = () => {
  const [saveStatus, setSaveStatus] = createSignal<string | null>(null);
  const [showSettings, setShowSettings] = createSignal(false);
  const [showHelp, setShowHelp] = createSignal(false);
  const [navMenuOpen, setNavMenuOpen] = createSignal(false);
  const [dbReady, setDbReady] = createSignal(false);
  let navMenuRef: HTMLDivElement | undefined;

  const closeHelp = () => {
    setShowHelp(false);
    try {
      localStorage.setItem(HELP_SEEN_KEY, '1');
    } catch {
      // Ignore storage errors in restricted browsing modes
    }
  };

  onMount(async () => {
    try {
      if (!localStorage.getItem(HELP_SEEN_KEY)) {
        setShowHelp(true);
      }
    } catch {
      setShowHelp(true);
    }

    await loadSavedApp();
    setDbReady(true);

    const flushToDB = () => {
      if (dbReady()) void manualSaveApp();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushToDB();
    };
    const handleDocClick = (e: MouseEvent) => {
      if (!navMenuOpen()) return;
      if (
        navMenuRef &&
        !navMenuRef.contains(e.target as Node) &&
        !e.composedPath().includes(navMenuRef)
      ) {
        setNavMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && navMenuOpen()) {
        setNavMenuOpen(false);
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
    if (isActiveTimer() && navMenuOpen()) {
      setNavMenuOpen(false);
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
    void writeOpenItem();
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
      if (openFloaters.length === 0) {
        const curFocus = focusedEntity();
        const curWriteRef = writeOpenItem();
        const targetID = writerTargetID();
        if (userMode() === 'Focus' && curFocus) {
          setOpenFloaters([{ entityType: curFocus.entityType, refID: curFocus.refID }]);
        } else if (curWriteRef) {
          setOpenFloaters([{ entityType: curWriteRef.entityType, refID: curWriteRef.refID }]);
        } else if (targetID !== null && getStream(targetID)) {
          setOpenFloaters([{ entityType: 'stream', refID: targetID }]);
        } else {
          const activeVS = viewSpaces.find((vs) => vs.id === activeViewSpaceID());
          const tents = activeVS?.tentsInSpace || [];
          const lastEnt = tents.length > 0 ? tents[tents.length - 1] : null;
          if (lastEnt) {
            setOpenFloaters([{ entityType: lastEnt.entityType, refID: lastEnt.refID }]);
          }
        }
      }
      setUserMode('Review');
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
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          theme={appTheme}
          onToggleTheme={toggleTheme}
        />
        <HelpModal isOpen={showHelp} onClose={closeHelp} />

        <header class="wb-navbar" role="banner">
          <div class="wb-navbar__left">
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
                classList={{ 'wb-navbar__btn--active': userMode() === 'Review' }}
                disabled={isActiveTimer()}
                onClick={handleEnterReviewMode}
              >
                Review
              </button>
            </nav>
          </div>

          <h1 class="wb-navbar__brand">Writers Block</h1>

          <div class="wb-navbar__right">
            <div class="wb-navbar__menu-wrap" ref={navMenuRef}>
              <button
                type="button"
                class="wb-navbar__hamburger"
                classList={{ 'wb-navbar__btn--active': navMenuOpen() }}
                disabled={isActiveTimer()}
                aria-expanded={navMenuOpen()}
                aria-haspopup="menu"
                aria-label="Open menu"
                title="Menu"
                onClick={() => setNavMenuOpen((prev) => !prev)}
              >
                <Show
                  when={!navMenuOpen()}
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

              <Show when={navMenuOpen()}>
                <div class="wb-nav-menu" role="menu" aria-label="Navigation Menu">
                  <div class="wb-nav-menu__brand">Writers Block</div>

                  <button
                    type="button"
                    role="menuitem"
                    class="wb-nav-menu__item"
                    classList={{ 'wb-nav-menu__item--active': showSettings() }}
                    disabled={isActiveTimer()}
                    onClick={() => {
                      setNavMenuOpen(false);
                      setShowSettings((prev) => !prev);
                    }}
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    class="wb-nav-menu__item"
                    disabled={isActiveTimer()}
                    onClick={() => {
                      setNavMenuOpen(false);
                      void handleSave();
                    }}
                  >
                    {saveStatus() || 'Save Session to File'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    class="wb-nav-menu__item"
                    disabled={isActiveTimer()}
                    onClick={() => {
                      setNavMenuOpen(false);
                      void handleLoad();
                    }}
                  >
                    Load from File
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    class="wb-nav-menu__item"
                    classList={{ 'wb-nav-menu__item--active': showHelp() }}
                    disabled={isActiveTimer()}
                    onClick={() => {
                      setNavMenuOpen(false);
                      setShowHelp(true);
                    }}
                  >
                    Help
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

          <Switch>
            <Match when={userMode() === 'Write'}>
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

              <Show when={writeOpenItem()}>
                <section class="wb-reader-stack" aria-label="Open Reference Item">
                  <ViewMultItems
                    innerClickMode="write"
                    items={() => (writeOpenItem() ? [writeOpenItem()!] : [])}
                  />
                </section>
              </Show>
            </Match>

            <Match when={userMode() === 'Review'}>
              <main class="wb-review-deck" id="focal-stage" tabindex="-1" aria-label="Review Streams and Free Items">
                <Show
                  when={openFloaters.length > 0}
                  fallback={
                    <div class="wb-reader-empty">
                      Select streams or free items above to open them in Review.
                    </div>
                  }
                >
                  <ViewMultItems innerClickMode="multi" />
                </Show>
              </main>
            </Match>

            <Match when={userMode() === 'Focus'}>
              <main class="wb-stage" id="focal-stage" tabindex="-1">
                <article class="wb-focal-chamber wb-focal-chamber--reader" data-measure="narrow">
                  <FocusViewer innerClickMode="focus" />
                </article>
              </main>
            </Match>
          </Switch>
        </div>

        <aside class="wb-suspension-bar" aria-label="Suspension Bar for items in transit">
          <SuspenBar />
        </aside>

      </div>
    </>
  );
}

export default App;
