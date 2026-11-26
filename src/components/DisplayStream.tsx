import { type Component, batch, createMemo, createSignal, Show, For } from 'solid-js';
import { EditTitle } from './EditTitle';
import {
  allStreams, updateStreamTitle,
  groupedFlashIDs,
  deleteStream,
  replaceInOpenFloaters,
  setFocusedStreamID,
  viewSpaces,
  getStreamTSpan,
  hoverEnt,
  setHoverEnt,
  saveStreamToFile,
  setUserMode,
  setFocusedEntity,
  sendToSuspenBar,
} from '../store';
import { DisplayFlash } from './DisplayFlash';
import { isActiveTimer } from './FocusWriter';
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
      // Minimizing a stream does NOT clear it as writerTargetID
      replaceInOpenFloaters({ entityType: 'stream', refID: props.id }, null);
    } else if (props.innerClickMode === 'focus') {
      setFocusedStreamID(0);
      setFocusedEntity(null);
    }
  };
  const handleDelete = () => {
    const id = props.id;
    batch(() => {
      replaceInOpenFloaters({ entityType: 'stream', refID: id }, null);
      if (props.innerClickMode === 'focus') {
        setFocusedStreamID(0);
        setFocusedEntity(null);
      }
      deleteStream(id);
    });
  };

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
              <Show when={props.innerClickMode !== 'focus'}>
                <button
                  type="button"
                  class="stream-action-pill"
                  disabled={isActiveTimer()}
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
                disabled={isActiveTimer()}
                onClick={() => saveStreamToFile(stream()!.id)}
                title="Save to File"
                aria-label="Save to File"
              >
                [↓]
              </button>
              <button
                type="button"
                class="stream-action-pill"
                disabled={isActiveTimer()}
                onClick={() => sendToSuspenBar('stream', stream()!.id)}
                title="Suspend"
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
                disabled={isActiveTimer()}
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
                onClick={() => {
                  if (!isActiveTimer()) setIsEditingTitle(true);
                }}
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
            <For each={groupedContent()}>
              {(group) => (
                <div
                  classList={{
                    ['paragraph']: true,
                    ['flicker-highlight']:
                      Boolean(group.flickerID) &&
                      ((hoverEnt()?.entityType === 'flicker' &&
                        hoverEnt()?.refID === group.flickerID) ||
                        (hoverEnt()?.entityType === 'flash' &&
                          group.flashIDs.includes(hoverEnt()!.refID))),
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
                  <For each={group.flashIDs}>
                    {(flashID, index) => {
                      const prevID = () => (index() > 0 ? group.flashIDs[index() - 1] : null);
                      return (
                        <DisplayFlash
                          id={flashID}
                          prevID={prevID}
                          showTimes={() => showTimes()}
                          isSpaced={() => flashSpacing()}
                          renderedBy="stream"
                          parentStreamID={props.id}
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


