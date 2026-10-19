import { type Component, Show, For, createSignal, createMemo } from 'solid-js';
import { allFlickers,
  allStreams,
  addToChain,
  deleteFlicker,
  getFlickerTSpan,
  makeStreamFrom,
  openFloaters,
  sendToSuspenBar,
  setFocusedEntity,
  setOpenFloaters,
  viewSpaces } from '../store';
import { DisplayFlash } from './DisplayFlash';
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

  const [bg, setBG] = createSignal(true);
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const [flashSpacing, setFlashSpacing] = createSignal(false);
  const [showTimes, setShowTimes] = createSignal(false);
  const [flowUp, setFlowUp] = createSignal(false);

  const holdingStream = () =>
    allStreams.find((s) => s.contentIDs.includes(props.id)) || null;

  const handleMinimize = () => {
    const parentStream = holdingStream();
    if (props.innerClickMode === 'multi') {
      setOpenFloaters(() =>
        openFloaters.filter(
          (ent) => !(ent.entityType === 'flicker' && ent.refID === props.id)
        )
      );
    } else if (parentStream) {
      setFocusedEntity({ entityType: 'stream', refID: parentStream.id });
    } else {
      setFocusedEntity(null);
    }
  };

  const handleDelete = () => deleteFlicker(flicker()!.id) && handleMinimize();

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
      <div class={bg() ? 'floater-flicker white-bg' : 'floater-flicker parchment-bg'}>
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
                title='"Seed" New Stream with Copy'
                onClick={() =>
                  makeStreamFrom({ entityType: 'flicker', refID: flicker()!.id })
                }
              >
                ⚵
              </button>
              <button
                type="button"
                class="stream-action-pill"
                title="Add to Target SparkChain"
                onClick={() => {
                  if (flicker()?.id) addToChain(flicker()!.id);
                }}
              >
                ☍
              </button>
            </div>

            <ReplayHeaderControl controller={replay} />

            <div class="stream-header__actions-right">
              <button
                type="button"
                class="stream-action-pill"
                title="Suspend"
                onClick={() => sendToSuspenBar('flicker', flicker()!.id)}
              >
                ↯
              </button>

              <button
                type="button"
                class={deleteClicked() ? 'delete-reveal confirm-delete-btn' : 'delete-hide'}
                onClick={() => (deleteClicked() ? handleDelete() : '')}
              >
                Confirm?
              </button>
              <button
                type="button"
                class={deleteClicked() ? 'delete-hide stream-icon-btn' : 'delete-reveal stream-icon-btn'}
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
              <span>
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
                classList={{ 'optic-active': !bg() }}
                title="Change Background"
                onClick={() => setBG((p) => !p)}
              >
                ⬚
              </button>
              <button
                type="button"
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
                  const prevID = index() > 0 ? orderedFlashIDs()[index() - 1] : null;
                  return (
                    <DisplayFlash
                      id={flashID}
                      prevID={prevID}
                      showTimes={() => showTimes()}
                      isSpaced={() => flashSpacing()}
                      renderedBy="flicker"
                      clickDo={props.innerClickMode}
                    />
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};
