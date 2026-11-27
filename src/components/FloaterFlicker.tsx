import { type Component, Show, For, batch, createSignal, createMemo } from 'solid-js';
import {
  allFlickers,
  allStreams,
  deleteFlicker,
  getFlickerTSpan,
  hoverEnt,
  replaceInOpenFloaters,
  sendToSuspenBar,
  setFocusedEntity,
  setSeedSource,
  setUserMode,
  viewSpaces,
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
  innerClickMode?: string;
}

export const FloaterFlicker: Component<FloaterFlashProps> = (props) => {
  const flicker = () => allFlickers.find(f => f.id === props.id);
  const createDateTime = () => new Date(flicker()!.createDT);
  const heldBy =
    () => allStreams.find(s =>
      s.contentIDs
        .includes(props.id))?.title
      || viewSpaces.find(vs =>
        vs.tentsInSpace.some( ent =>
            ent.entityType === 'flicker' &&
            ent.refID === props.id
          ))
        ?.title;

  const [hideContent, setHideContent] = createSignal(false);
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const [flashSpacing, setFlashSpacing] = createSignal(false);
  const [showTimes, setShowTimes] = createSignal(false);
  const [flowUp, setFlowUp] = createSignal(false);

  const holdingStream = () =>
    allStreams.find((s) => s.contentIDs.includes(props.id)) || null;

  const handleMinimize = () => {
    const parentStream = holdingStream();
    if (props.innerClickMode === 'multi') {
      replaceInOpenFloaters(
        { entityType: 'flicker', refID: props.id },
        parentStream ? { entityType: 'stream', refID: parentStream.id } : null
      );
    } else if (parentStream) {
      setFocusedEntity({ entityType: 'stream', refID: parentStream.id });
    } else {
      setFocusedEntity(null);
    }
  };

  const handleDelete = () => {
    const id = props.id;
    const parentStream = holdingStream();
    batch(() => {
      if (props.innerClickMode === 'multi') {
        replaceInOpenFloaters(
          { entityType: 'flicker', refID: id },
          parentStream ? { entityType: 'stream', refID: parentStream.id } : null
        );
      } else {
        setFocusedEntity(
          parentStream ? { entityType: 'stream', refID: parentStream.id } : null
        );
      }
      deleteFlicker(id);
    });
  };

  const orderedFlashIDs = createMemo(() => {
    const ids = [...(flicker()?.contentIDs || [])];
    return flowUp() ? ids.reverse() : ids;
  });

  const replay = createReplayController(
    () => [
      {
        type: 'flicker',
        flashIDs: [...(flicker()?.contentIDs || [])],
        flickerID: props.id,
      },
    ],
    () => props.id
  );

  return (
    <Show when={flicker()}>
      <div class="floater-flicker">
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
                title="Seed a new stream from a copy of this flicker"
                onClick={() =>
                  setSeedSource({ entityType: 'flicker', refID: props.id })
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
                    setFocusedEntity({ entityType: 'flicker', refID: flicker()!.id });
                    setUserMode('Read');
                  }}
                  title="Focus Flicker in Reader Mode"
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
                onClick={() => sendToSuspenBar('flicker', flicker()!.id)}
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
                title={holdingStream() ? 'Back to Stream' : 'Minimize Flicker'}
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
                title="Delete Flicker"
              >
                ×
              </button>
            </div>
          </div>

          <div class="stream-header__identity">
            <h1 class="grav-pt stream-header__title stream-header__title--static">
              Flicker
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
              <span>{(getFlickerTSpan(flicker()!.id) / 1000).toFixed(1)}s</span>
            </div>
          </div>

          <div class="flex-top-down">
            <div class="tiny-fun flex-wide" role="group" aria-label="Flicker display options">
              <button
                type="button"
                disabled={isActiveTimer()}
                classList={{ 'optic-active': hideContent() }}
                title={hideContent() ? 'Show Text Content' : 'Hide Text Content'}
                onClick={() => setHideContent((p) => !p)}
              >
                ⬚
              </button>
              <button
                type="button"
                disabled={isActiveTimer()}
                class={flowUp() ? 'anim-flip-on' : 'anim-flip-off'}
                title="Flip Order"
                onClick={() => {
                  setFlowUp(!flowUp());
                  setShowTimes(false);
                }}
              >
                🡇
              </button>
              <button
                type="button"
                disabled={isActiveTimer()}
                title="Toggle Spacing"
                class={
                  showTimes()
                    ? 'anim-spacing inactivated'
                    : flashSpacing()
                    ? 'anim-spacing'
                    : 'anim-spacing-off'
                }
                onClick={() => setFlashSpacing(!flashSpacing())}
              >
                ⟣⟢
              </button>
              <button
                type="button"
                disabled={isActiveTimer()}
                title="Toggle Timestamps"
                class={
                  flowUp()
                    ? 'anim-flip-off inactivated'
                    : showTimes()
                    ? 'anim-flip-on'
                    : 'anim-flip-off'
                }
                onClick={() => {
                  setFlashSpacing(true);
                  setShowTimes(!showTimes());
                }}
              >
                ⏲
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
                  showTimes={() => showTimes()}
                  isSpaced={() => flashSpacing()}
                />
              }
            >
              <div class="paragraph">
                <For each={orderedFlashIDs()}>
                  {(flashID, index) => {
                    const prevID = () => (index() > 0 ? orderedFlashIDs()[index() - 1] : null);
                    return (
                      <DisplayFlash
                        id={flashID}
                        prevID={prevID}
                        showTimes={() => showTimes()}
                        isSpaced={() => flashSpacing()}
                        renderedBy="flicker"
                        parentFlickerID={props.id}
                        clickDo={props.innerClickMode}
                        isHovered={
                          hoverEnt()?.entityType === 'flash' &&
                          hoverEnt()?.refID === flashID
                        }
                      />
                    );
                  }}
                </For>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </Show>
  );
};
