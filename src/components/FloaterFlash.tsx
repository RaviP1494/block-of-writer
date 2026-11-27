import { type Component, Show, batch, createSignal } from 'solid-js';
import {
  allFlashes,
  allFlickers,
  allStreams,
  deleteFlash,
  replaceInOpenFloaters,
  sendToSuspenBar,
  setFocusedEntity,
  setSeedSource,
  setUserMode,
  viewSpaces,
  type MultEnt,
} from '../store';
import { DisplayFlash } from './DisplayFlash';
import { isActiveTimer } from './FocusWriter';

import {
  createReplayController,
  ReplayHeaderControl,
  ReplayTextView,
} from './ReplayEngine';

interface FloaterFlashProps {
  id: number;
  clickSource?: MultEnt;
  innerClickMode?: string;
}

export const FloaterFlash: Component<FloaterFlashProps> = (props) => {
  const [hideContent, setHideContent] = createSignal(false);
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const holdingFlicker = () =>
    allFlickers.find((f) => f.contentIDs.includes(props.id)) || null;

  const holdingStream = () => {
    const flk = holdingFlicker();
    return allStreams.find((s) =>
      s.contentIDs.includes(flk ? flk.id : props.id)
    ) || null;
  };

  const flash = () => allFlashes.find((f) => f.id === props.id);

  const createDateTime = () => new Date(flash()!.createDT);

  const heldBy = () => {
    const flk = holdingFlicker();
    const stream = holdingStream();
    if (stream) return stream.title;
    const vs = viewSpaces.find((v) =>
      v.tentsInSpace.some(
        (ent) =>
          ent.entityType === (flk ? 'flicker' : 'flash') &&
          ent.refID === (flk ? flk.id : props.id)
      )
    );
    return vs?.title;
  };

  const handleMinimize = () => {
    const flk = holdingFlicker();
    const stream = holdingStream();
    const parent: MultEnt | null = flk
      ? { entityType: 'flicker', refID: flk.id }
      : stream
        ? { entityType: 'stream', refID: stream.id }
        : null;

    if (props.innerClickMode === 'multi') {
      replaceInOpenFloaters({ entityType: 'flash', refID: props.id }, parent);
    } else {
      setFocusedEntity(parent);
    }
  };

  const handleDelete = () => {
    const id = props.id;
    const flk = holdingFlicker();
    const parentStream = holdingStream();

    batch(() => {
      deleteFlash(id);

      let nextParent: MultEnt | null = null;
      if (flk) {
        const updatedFlk = allFlickers.find((f) => f.id === flk.id);
        if (updatedFlk && updatedFlk.contentIDs.length > 0) {
          nextParent = { entityType: 'flicker', refID: flk.id };
        } else if (parentStream) {
          nextParent = { entityType: 'stream', refID: parentStream.id };
        }
      } else if (parentStream) {
        nextParent = { entityType: 'stream', refID: parentStream.id };
      }

      if (props.innerClickMode === 'multi') {
        replaceInOpenFloaters({ entityType: 'flash', refID: id }, nextParent);
      } else {
        setFocusedEntity(nextParent);
      }
    });
  };

  const replay = createReplayController(
    () => [{ type: 'flashes', flashIDs: [props.id], flickerID: null }],
    () => props.id
  );

  return (
    <Show when={flash()}>
      <div class="floater-flash">
        <header class="stream-title">
          <div
            onMouseLeave={() => setDeleteClicked(false)}
            class="display-top-box"
            classList={{ 'display-top-box--confirming': deleteClicked() }}
          >
            <div class="stream-header__actions-left">
              <button
                type="button"
                class="stream-action-pill"
                disabled={isActiveTimer()}
                title="Seed a new stream from a copy of this flash"
                onClick={() =>
                  setSeedSource({ entityType: 'flash', refID: props.id })
                }
              >
                Seed
              </button>
              <Show when={props.innerClickMode !== 'focus'}>
                <button
                  type="button"
                  class="stream-action-pill"
                  disabled={isActiveTimer()}
                  onClick={() => {
                    setFocusedEntity({ entityType: 'flash', refID: flash()!.id });
                    setUserMode('Read');
                  }}
                  title="Focus Flash in Reader Mode"
                >
                  Focus
                </button>
              </Show>
            </div>

            <ReplayHeaderControl controller={replay} />

            <div class="stream-header__actions-right">
              <button
                type="button"
                class="stream-action-pill"
                disabled={isActiveTimer()}
                title="Suspend"
                onClick={() => sendToSuspenBar('flash', flash()!.id)}
              >
                ↯
              </button>
              <button
                type="button"
                class={deleteClicked() ? 'delete-reveal confirm-delete-btn' : 'delete-hide'}
                disabled={isActiveTimer()}
                onClick={() => (deleteClicked() ? handleDelete() : '')}
              >
                Confirm?
              </button>
              <button
                type="button"
                class={deleteClicked() ? 'delete-hide stream-icon-btn' : 'delete-reveal stream-icon-btn'}
                disabled={isActiveTimer()}
                onClick={() => handleMinimize()}
                title={
                  holdingFlicker()
                    ? 'Back to Flicker'
                    : holdingStream()
                      ? 'Back to Stream'
                      : 'Minimize Flash'
                }
              >
                −
              </button>
              <button
                type="button"
                class={
                  deleteClicked()
                    ? 'delete-hide stream-icon-btn stream-icon-btn--danger'
                    : 'delete-reveal stream-icon-btn stream-icon-btn--danger'
                }
                disabled={isActiveTimer()}
                onClick={() => setDeleteClicked(true)}
                title="Delete Flash"
              >
                ×
              </button>
            </div>
          </div>

          <div class="stream-header__identity">
            <h1 class="grav-pt stream-header__title stream-header__title--static">
              Flash
            </h1>
            <div class="reader-stats">
              <span
                title={createDateTime().toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              >
                {createDateTime().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <Show when={heldBy()}>
                <span>{heldBy()}</span>
              </Show>
              <span>{(flash()!.tSpan / 1000).toFixed(1)}s</span>
            </div>
          </div>

          <div class="flex-top-down">
            <div class="tiny-fun flex-wide" role="group" aria-label="Flash display options">
              <button
                type="button"
                disabled={isActiveTimer()}
                classList={{ 'optic-active': hideContent() }}
                title={hideContent() ? 'Show Text Content' : 'Hide Text Content'}
                onClick={() => setHideContent((p) => !p)}
              >
                ⬚
              </button>
            </div>
          </div>
        </header>

        <Show when={!hideContent()}>
          <div class="stream-text">
            <Show
              when={!replay.isReplaying()}
              fallback={
                <ReplayTextView
                  controller={replay}
                  showTimes={() => false}
                  isSpaced={() => true}
                />
              }
            >
              <DisplayFlash
                id={props.id}
                showTimes={() => false}
                isSpaced={() => true}
                renderedBy="flash"
              />
            </Show>
          </div>
        </Show>
      </div>
    </Show>
  );
};
