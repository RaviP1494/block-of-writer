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
  setHoverEnt
} from '../store';
import { DisplayFlash } from './DisplayFlash';

export interface DisplayStreamProps {
  id: number;
  innerClickMode?: string;
}

export const DisplayStream: Component<DisplayStreamProps> = (props) => {
  const [streamBG, setStreamBG] = createSignal(true);
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
    props.innerClickMode === 'multi' 
      ? setOpenFloaters(() => [
        ...openFloaters.filter(
          ent => ent.refID !== stream()?.id 
            || ent.entityType !== 'stream')])
      : props.innerClickMode === 'focus' 
        ? setFocusedStreamID(0)
        : null;
  }

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

  return (
    <Show when={stream()}>
      <div class={streamBG() ? 'stream-box white-bg' : 'stream-box parchment-bg'}>
        <div class='stream-title'>
          <Show when={!isEditingTitle()}
            fallback={
              <EditTitle
                initialValue={stream()!.title}
                onSave={(title: string) => {
                  updateStreamTitle(stream()!.id, title);
                  setIsEditingTitle(false);
                }}
                onCancel={() => setIsEditingTitle(false)} />
            }>

                  <div onMouseLeave={() => setDeleteClicked(false)}
                    class='display-top-box'
                    style={{
                      border: deleteClicked() ? '1px dashed #003004' : 'none',
                      transition: 'border 0.5s ease'
                    }}>
                    <button 
                      class='transparent'
                      style={{width: 'fit-content'}}
                      onClick={()=> console.log('reader-mode')//here be reader mode
                      }>
                      Focus
                    </button>
                    <button class={deleteClicked()
                      ? 'delete-reveal' : 'delete-hide'}
                      onClick={() =>
                        deleteClicked()
                          ? handleDelete()
                          : ''}
                    >
                      Confirm?
                    </button>
                  <button
                    class={deleteClicked() ?
                      'delete-hide' : 'delete-reveal'}
                    style={{ 'background-color': '#ff8000', right: '20px' }}
                    onClick={() => handleMinimize()}>
                    -
                  </button>
                    <button
                      onClick={() => setDeleteClicked(true)}
                      class={deleteClicked() ?
                        'delete-hide' : 'delete-reveal'}>
                      X
                    </button>
                  </div>
              <h1
              class='grav-pt'
              onClick={() => setIsEditingTitle(true)}>
                {stream()?.title}
              </h1>
                <div class='reader-stats'>
                <span>{createDateTime().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</span>
                <span>{heldBy()}</span>
                <span>{getStreamTSpan(props.id)}</span>
                </div>
            <div
              class='flex-top-down'
              style={{
                position: 'relative'
              }}>

              <div class='tiny-fun flex-wide'>
                <button
                title='Change Background'
                  onClick={() => setStreamBG(p => !p)}
                >
                  ⬚
                </button>
                <button
                title='Flip Order'
                  class={flowUp() ? 'anim-flip-on' : 'anim-flip-off'}
                  onClick={() => {
                    setFlowUp(!flowUp())
                    setShowTimes(false)
                  }}>
                  🡇
                </button>
                <button
                title='Toggle Spacing'
                  class={
                    showTimes() ? 'anim-spacing inactivated'
                      : flashSpacing() ? 'anim-spacing' : 'anim-spacing-off'}
                  onClick={() =>
                    setFlashSpacing(!flashSpacing())}>
                  ⟣⟢
                </button>
                <button
                title='Toggle Timestamps'
                  class={flowUp() ? 'anim-flip-off inactivated'
                    : showTimes() ? 'anim-flip-on' : 'anim-flip-off'}
                  onClick={() => {
                    setFlashSpacing(true)
                    setShowTimes(!showTimes())
                  }}>
                  ⏲
                </button>
              </div>
            </div>
          </Show>
        </div>
        <div class='stream-text'>
          <For each={groupedContent()}>
            {(group) => (
              <div
              classList={{
                ['paragraph']: true,
                ['flicker-highlight']: 
                  (hoverEnt()?.entityType === group.type 
                  && hoverEnt()?.refID === group.flickerID)
              }}
              onMouseOver={() => group.flickerID
                && setHoverEnt({
                  entityType: 'flicker',
                  refID: group.flickerID!})}
              onMouseLeave={() => setHoverEnt(null)}
              >
                <For each={group.flashIDs}>
                  {(flashID, index) => {
                    const prevID = index() > 0 ? group.flashIDs[index() - 1] : null;
                    return <DisplayFlash id={flashID}
                      prevID={prevID}
                      showTimes={() => showTimes()}
                      isSpaced={() => flashSpacing()}
                      renderedBy='stream'
                      clickDo={props.innerClickMode}
                      isHovered={
                        hoverEnt()?.entityType === 'flash' 
                        && hoverEnt()?.refID === flashID}/>;
                  }}
                </For>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};


