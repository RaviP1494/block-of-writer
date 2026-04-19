import { type Component, createMemo, createSignal, Show, For } from 'solid-js';
import { EditTitle } from './EditTitle';
import {
  allStreams, updateStreamTitle,
  groupedFlashIDs
} from '../store';
import { DisplayFlash } from './DisplayFlash';

export interface DisplayStreamProps {
  id: number;
}

export const DisplayStream: Component<DisplayStreamProps> = (props) => {
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const [flashSpacing, setFlashSpacing] = createSignal(false);
  const [showTimes, setShowTimes] = createSignal(false);
  const [flowUp, setFlowUp] = createSignal(false);
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);

  const stream = () => allStreams.find((stream) => stream.id === props.id);

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
      <div class='tiny-fun flex-center'>
        <button
        class={flowUp() ? 'anim-flip-on' : 'anim-flip-off'}
          onClick={() => {
            setFlowUp(!flowUp())
            setShowTimes(false)
          }}>🡇</button>
        <button
        class={
          showTimes() ? 'anim-spacing inactivated' 
            : flashSpacing() ? 'anim-spacing' : 'anim-spacing-off' }
          onClick={() =>
            setFlashSpacing(!flashSpacing())}>
         ⟣⟢
        </button>
        <button
        class={flowUp() ? 'tog-off anim-flip-off inactivated' 
          : showTimes() ? 'tog-on anim-flip-on' : 'tog-off anim-flip-off'}
          onClick={() => {
            setFlashSpacing(true)
            setShowTimes(!showTimes())
          }}>⏲</button>
      </div>
      <div class='flex-top-down stream-box'>
        <div class='stream'>
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
              <div class='flex-center' style={{position: 'relative'}}>
              <button onClick={()=>
                deleteClicked() 
                  ? console.log(stream()?.id)
                  : setDeleteClicked(true) }
                  onMouseOut={()=>setDeleteClicked(false)}
                  class='stream-delete'>{deleteClicked() ? 'Delete?' : 'x'}</button>
              <h2 onClick={() => setIsEditingTitle(true)}>
                {stream()?.title}
              </h2>
              </div>
            </Show>
          </div>
          <For each={groupedContent()}>
            {(group) => (
              <div
                class={
                  flashSpacing() ?
                    'flicker' :
                    'paragraph flicker'}>
                <For each={group.flashIDs}>
                  {(flashID, index) => {
                    const prevID = index() > 0 ? group.flashIDs[index() - 1] : null;
                    return <DisplayFlash id={flashID}
                      prevID={prevID}
                      showTimes={() => showTimes()}
                      isSpaced={() => flashSpacing()} />;
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


