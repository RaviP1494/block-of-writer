import { type Component, createMemo, createSignal, Show, For } from 'solid-js';
import { EditTitle } from './EditTitle';
import {
  allStreams, updateStreamTitle,
  groupedFlashIDs,
  deleteStream,
  openFloaters,
  setOpenFloaters,
  setFocusedStreamID,
  viewSpaces,
  getStreamTSpan,
  hoverEnt,
  setHoverEnt,
  addToChain,
  saveStreamToFile,
  writerTargetID,
  setWriterTargetID,
  setUserMode,
  setFocusedEntity,
  sendToSuspenBar
} from '../store';
import { DisplayFlash } from './DisplayFlash';
import {
  createReplayController,
  ReplayHeaderControl,
  ReplayTextView,
} from './ReplayEngine';

export interface DisplayStreamProps {
  id: number;
  innerClickMode?: string;
}

export const DisplayStream: Component<DisplayStreamProps> = (props) => {
  const [hideContent, setHideContent] = createSignal(false);
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const [flashSpacing, setFlashSpacing] = createSignal(false);
  const [showTimes, setShowTimes] = createSignal(false);
  const [flowUp, setFlowUp] = createSignal(false);
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);

  const stream = () => allStreams.find((stream) => stream.id === props.id);

  const createDateTime = () => new Date(stream()!.createDT);

  const heldBy = () => viewSpaces.find(vs =>
    vs.tentsInSpace.some(ent =>
      ent.entityType === 'stream' &&
      ent.refID === props.id
    ))
    ?.title;

  const handleMinimize = () => {
    if (props.innerClickMode === 'multi') {
      setOpenFloaters(() => [
        ...openFloaters.filter(
          (ent) => ent.refID !== stream()?.id || ent.entityType !== 'stream'
        ),
      ]);
      if (writerTargetID() === stream()?.id) {
        setWriterTargetID(null);
      }
    } else if (props.innerClickMode === 'focus') {
      setFocusedStreamID(0);
      setFocusedEntity(null);
    } else if (writerTargetID() === stream()?.id) {
      setWriterTargetID(null);
    }
  };
  const handleDelete = () => deleteStream(stream()!.id) && handleMinimize();

  const groupedContent = createMemo(() => {
    let groups = [...groupedFlashIDs(props.id)];
    if (flowUp()) {
      groups.reverse();
      groups = groups.map(group => {
        if (flashSpacing()) {
          return { ...group, flashIDs: [...group.flashIDs].reverse() };
        }
        return group;
      });
    }
    return groups;
  });

  const replay = createReplayController(
    () => groupedFlashIDs(props.id),
    () => props.id
  );

  return (
    <Show when={stream()}>
      <div class='stream-box'>
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
                onClick={() => saveStreamToFile(stream()!.id)}
                title="Save Stream to File"
              >
                Save
              </button>
              <Show when={props.innerClickMode !== 'focus'}>
                <button
                  type="button"
                  class="stream-action-pill"
                  onClick={() => {
                    setFocusedStreamID(stream()!.id);
                    setFocusedEntity({ entityType: 'stream', refID: stream()!.id });
                    setUserMode('Read');
                  }}
                  title="Focus Stream in Reader Mode"
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
                onClick={() => sendToSuspenBar('stream', stream()!.id)}
                title="Suspend"
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
                title="Minimize Stream"
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
                title="Delete Stream"
              >
                ×
              </button>
            </div>
          </div>

          <div class="stream-header__identity">
            <Show
              when={!isEditingTitle()}
              fallback={
                <EditTitle
                  initialValue={stream()!.title}
                  onSave={(title: string) => {
                    updateStreamTitle(stream()!.id, title);
                    setIsEditingTitle(false);
                  }}
                  onCancel={() => setIsEditingTitle(false)}
                />
              }
            >
              <h1
                class="grav-pt stream-header__title"
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename stream"
              >
                {stream()?.title}
              </h1>
            </Show>

            <div class="reader-stats">
              <span>{createDateTime().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>{heldBy()}</span>
              <span>{getStreamTSpan(props.id)}</span>
            </div>
          </div>

          <div class="flex-top-down">
            <div class="tiny-fun flex-wide" role="group" aria-label="Stream display options">
              <button
                type="button"
                title="Hide Text Content"
                onClick={() => setHideContent((p)=>!p)}
              >
                ⬚
              </button>
              <button
                type="button"
                title="Flip Order"
                class={flowUp() ? 'anim-flip-on' : 'anim-flip-off'}
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
            <For each={groupedContent()}>
              {(group) => (
                <div
                  classList={{
                    ['paragraph']: true,
                    ['flicker-highlight']:
                      hoverEnt()?.entityType === group.type &&
                      hoverEnt()?.refID === group.flickerID,
                  }}
                  onMouseOver={() =>
                    group.flickerID &&
                    setHoverEnt({
                      entityType: 'flicker',
                      refID: group.flickerID!,
                    })
                  }
                  onMouseLeave={() => setHoverEnt(null)}
                >
                  <Show when={group.flickerID && props.innerClickMode === 'chain'}>
                    <button
                      class="chain-add-flicker-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToChain(group.flickerID!);
                      }}
                      title="Add flicker to target chain"
                      style={{
                        background: 'transparent',
                        border: '1px dashed #ff8000',
                        color: '#ff8000',
                        'border-radius': '3px',
                        'font-size': '0.75rem',
                        cursor: 'pointer',
                        margin: '0 4px',
                        padding: '0 4px',
                      }}
                    >
                      + Flicker
                    </button>
                  </Show>
                  <For each={group.flashIDs}>
                    {(flashID, index) => {
                      const prevID = index() > 0 ? group.flashIDs[index() - 1] : null;
                      return (
                        <DisplayFlash
                          id={flashID}
                          prevID={prevID}
                          showTimes={() => showTimes()}
                          isSpaced={() => flashSpacing()}
                          renderedBy="stream"
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
              )}
            </For>
          </Show>
        </div>
      </Show>
      </div>
    </Show>
  );
};


