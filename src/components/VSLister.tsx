import { batch, createSignal, For, Show, type Component } from 'solid-js';
import {
  activeViewSpaceID,
  createNewViewSpace,
  setActiveViewSpaceID,
  setFocusedEntity,
  setFocusedStreamID,
  updateSpaceName,
  viewSpaces,
  streamFlashes,
  getFlash,
  getFlicker,
  getEmacsDateString,
  userMode,
  type ViewSpace,
} from '../store';
import { EditTitle } from './EditTitle';
import { StreamSelector } from './StreamSelector';
import { VSReadPicker } from './VSReadPicker';
import { isActiveTimer } from './FocusWriter';

export type VSDisplayMode = 'active' | 'grid';
export const [vsDisplayMode, setVsDisplayMode] = createSignal<VSDisplayMode>('active');

const getVSStats = (vs: ViewSpace) => {
  let streams = 0;
  let tSpan = 0;

  vs.tentsInSpace.forEach((ent) => {
    if (ent.entityType === 'stream') {
      streams++;
      const sFlashes = streamFlashes(ent.refID);
      sFlashes.forEach((f) => {
        tSpan += f.tSpan;
      });
    } else if (ent.entityType === 'flash') {
      const f = getFlash(ent.refID);
      if (f && f.id !== 0) {
        tSpan += f.tSpan;
      }
    } else if (ent.entityType === 'flicker') {
      const b = getFlicker(ent.refID);
      if (b && b.id !== 0 && b.contentIDs) {
        b.contentIDs.forEach((fid) => {
          const f = getFlash(fid);
          if (f && f.id !== 0) {
            tSpan += f.tSpan;
          }
        });
      }
    }
  });

  return {
    streams,
    seconds: Number((tSpan / 1000).toFixed(1)),
  };
};

const VSSummaryCell: Component<{ vs: ViewSpace; onSelect: () => void }> = (props) => {
  const stats = () => getVSStats(props.vs);
  const createdStr = () =>
    props.vs.createDT ? getEmacsDateString(props.vs.createDT) : 'No Date';

  return (
    <button
      type="button"
      class="vs-summary-cell"
      classList={{ 'active-vs': props.vs.id === activeViewSpaceID() }}
      onClick={props.onSelect}
    >
      <div class="vs-cell-title">{props.vs.title}</div>
      <div class="vs-cell-stats">
        {stats().seconds}s written • {stats().streams}{' '}
        {stats().streams === 1 ? 'Stream' : 'Streams'}
      </div>
      <div class="vs-cell-date">{createdStr()}</div>
    </button>
  );
};

const VSGridSelect: Component<{ onSelect: () => void }> = (props) => {
  const [newSpaceName, setNewSpaceName] = createSignal('');

  const handleCreateSpace = () => {
    createNewViewSpace(newSpaceName());
    setNewSpaceName('');
    props.onSelect();
  };

  return (
    <section class="vs-bus-stop" aria-label="ViewSpaces Directory">
      <header class="vs-bus-stop__header">
        <div class="vs-bus-stop__title-group">
          <h2 class="vs-bus-stop__title">ViewSpaces</h2>
          <span class="vs-bus-stop__subtitle">
            Select a destination space or initialize a new one
          </span>
        </div>

        <div class="vs-bus-stop__controls">
          <div class="vs-bus-stop__new-form">
            <input
              type="text"
              class="wb-modal-card__input vs-bus-stop__input"
              placeholder="New ViewSpace name..."
              value={newSpaceName()}
              onInput={(e) => setNewSpaceName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSpace();
              }}
            />
            <button
              type="button"
              class="wb-navbar__btn wb-navbar__btn--active"
              onClick={handleCreateSpace}
              title="Create and enter new ViewSpace"
            >
              + New Space
            </button>
          </div>

          <button
            type="button"
            class="wb-navbar__btn"
            onClick={props.onSelect}
            title="Return to active ViewSpace"
          >
            Return →
          </button>
        </div>
      </header>

      <div class="vs-bus-stop__grid">
        <For each={viewSpaces}>
          {(vs) => (
            <VSSummaryCell
              vs={vs}
              onSelect={() => {
                batch(() => {
                  setActiveViewSpaceID(vs.id);
                  // Write mode preserves writerTargetID & openFloaters cross-space; Read mode does a clean switch
                  if (userMode() === 'Read') {
                    setFocusedStreamID(0);
                    setFocusedEntity(null);
                  }
                });
                props.onSelect();
              }}
            />
          )}
        </For>
      </div>
    </section>
  );
};

const ActiveVSDisplay: Component<{ onOpenGrid: () => void }> = (props) => {
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);
  const activeVS = () => viewSpaces.find((vs) => vs.id === activeViewSpaceID());

  return (
    <div class="active-vs-display" role="region" aria-label="Active ViewSpace">
      <button
        type="button"
        class="stream-btn-icon stream-btn-icon--compact active-vs-switch-btn"
        disabled={isActiveTimer()}
        onClick={props.onOpenGrid}
        title="Browse or switch ViewSpaces"
        aria-label="Browse or switch ViewSpaces"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="5" height="5" rx="1.2" stroke="currentColor" stroke-width="1.4" />
          <rect x="8" y="1" width="5" height="5" rx="1.2" stroke="currentColor" stroke-width="1.4" />
          <rect x="1" y="8" width="5" height="5" rx="1.2" stroke="currentColor" stroke-width="1.4" />
          <rect x="8" y="8" width="5" height="5" rx="1.2" stroke="currentColor" stroke-width="1.4" />
        </svg>
      </button>
      <div class="active-vs-identity">
        <span class="active-vs-eyebrow">Space</span>
        <Show
          when={isEditingTitle()}
          fallback={
            <div
              class="active-vs-title-wrapper"
              onClick={() => {
                if (!isActiveTimer()) setIsEditingTitle(true);
              }}
              title="Click to rename active ViewSpace"
            >
              <span class="active-vs-title">{activeVS()?.title}</span>
              <span class="active-vs-edit-icon" aria-hidden="true">✎</span>
            </div>
          }
        >
          <EditTitle
            initialValue={activeVS()!.title}
            onSave={(title: string) => {
              updateSpaceName(activeVS()!.id, title);
              setIsEditingTitle(false);
            }}
            onCancel={() => setIsEditingTitle(false)}
          />
        </Show>
      </div>
    </div>
  );
};

export interface VSListerProps {
  mode?: 'bar' | 'grid';
}

export const VSLister: Component<VSListerProps> = (props) => {
  const showGrid = () =>
    props.mode ? props.mode === 'grid' : vsDisplayMode() === 'grid';

  return (
    <div
      class="wb-unified-selector"
      classList={{ 'wb-unified-selector--bus-stop': showGrid() }}
    >
      <Show
        when={!showGrid()}
        fallback={<VSGridSelect onSelect={() => setVsDisplayMode('active')} />}
      >
        <div class="wb-dock-row">
          <ActiveVSDisplay onOpenGrid={() => setVsDisplayMode('grid')} />
          <div class="wb-dock-divider" aria-hidden="true" />
          <div class="wb-dock-picker">
            <Show when={userMode() === 'Write'} fallback={<VSReadPicker />}>
              <StreamSelector />
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};
