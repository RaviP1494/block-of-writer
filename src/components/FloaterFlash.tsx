import { type Component, Show, createSignal } from 'solid-js';
import { 
  allFlashes,
  allFlickers,
  allStreams,
  addToChain,
  deleteFlash,
  makeStreamFrom,
  openFloaters,
  sendToSuspenBar,
  setFocusedEntity,
  setOpenFloaters,
  viewSpaces,
  type MultEnt } from '../store';
import { DisplayFlash } from './DisplayFlash';

interface FloaterFlashProps {
  id: number;
  clickSource?: MultEnt;
  innerClickMode?: string;
}

export const FloaterFlash: Component<FloaterFlashProps> = (props) => {
  const [bg, setBG] = createSignal(true);
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const holdingFlicker = () =>
    allFlickers.find((f) => f.contentIDs.includes(props.id)) || null;

  const flash = () => allFlashes.find((f) => f.id === props.id);

  const createDateTime = () => new Date(flash()!.createDT);

  const heldBy = () => {
    const flk = holdingFlicker();
    const holdingStream = allStreams.find((s) =>
      s.contentIDs.includes(flk ? flk.id || props.id : props.id)
    );
    if (holdingStream) return holdingStream.title;
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
    if (props.innerClickMode === 'multi') {
      setOpenFloaters(() =>
        openFloaters.filter(
          (ent) => !(ent.entityType === 'flash' && ent.refID === props.id)
        )
      );
    } else if (flk) {
      setFocusedEntity({ entityType: 'flicker', refID: flk.id });
    } else {
      setFocusedEntity(null);
    }
  };

  const handleDelete = () => deleteFlash(flash()!.id) && handleMinimize();

  return (
    <Show when={flash()}>
      <div class={bg() ? 'floater-flash white-bg' : 'floater-flash parchment-bg'}>
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
                  makeStreamFrom({ entityType: 'flash', refID: flash()!.id })
                }
              >
                ⚵
              </button>
              <button
                type="button"
                class="stream-action-pill"
                title="Add to Target SparkChain"
                onClick={() => {
                  if (flash()?.id) addToChain(flash()!.id);
                }}
              >
                ☍
              </button>
              <button
                type="button"
                class="stream-action-pill"
                title="Suspend"
                onClick={() => sendToSuspenBar('flash', flash()!.id)}
              >
                ↯
              </button>
            </div>

            <div class="stream-header__actions-right">
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
                title={holdingFlicker() ? 'Back to Flicker' : 'Minimize Flash'}
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
              <span>
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
                classList={{ 'optic-active': !bg() }}
                title="Change Background"
                onClick={() => setBG((p) => !p)}
              >
                ⬚
              </button>
            </div>
          </div>
        </header>

        <div class="stream-text">
          <DisplayFlash
            id={props.id}
            showTimes={() => false}
            isSpaced={() => true}
            renderedBy="flash"
          />
        </div>
      </div>
    </Show>
  );
};
