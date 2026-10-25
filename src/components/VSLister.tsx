import { createSignal, For, Show, type Component } from 'solid-js';
import {
  activeViewSpaceID,
  createNewViewSpace,
  setActiveViewSpaceID,
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
                setActiveViewSpaceID(vs.id);
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
    <div class="active-vs-display">
      <button
        type="button"
        class="stream-btn-icon stream-btn-icon--compact"
        onClick={props.onOpenGrid}
        title="Expand ViewSpaces Grid"
      >
        🗖
      </button>
      <Show
        when={isEditingTitle()}
        fallback={
          <div
            class="active-vs-title-wrapper"
            onClick={() => setIsEditingTitle(true)}
            title="Click to rename ViewSpace"
          >
            <span class="active-vs-title">{activeVS()?.title}</span>
            <span class="active-vs-edit-icon">✎</span>
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
  );
};

export const VSLister: Component = () => {
  return (
    <div
      class="wb-unified-selector"
      classList={{ 'wb-unified-selector--bus-stop': vsDisplayMode() === 'grid' }}
    >
      <Show
        when={vsDisplayMode() === 'active'}
        fallback={<VSGridSelect onSelect={() => setVsDisplayMode('active')} />}
      >
        <div class="wb-stream-dock">
          <ActiveVSDisplay onOpenGrid={() => setVsDisplayMode('grid')} />
          <Show when={userMode() === 'Write'} fallback={<VSReadPicker />}>
            <StreamSelector />
          </Show>
        </div>
      </Show>
    </div>
  );
};
