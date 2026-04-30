import { createEffect, createMemo, For, Show, type Component } from 'solid-js'
import { focusedEntity, getStream, openFloaters, setFocusedEntity, setOpenFloaters, setWriterTargetID, userMode, viewSpaces, writerTargetID, type MultEnt } from '../store';

interface VSListStreamsProps {
  id: number | null;
  clickAct: string;
};
export const VSListStreams: Component<VSListStreamsProps> = (props) => {

  if (!props.id) return (<div>no viewspace</div>)
  const vs = () => viewSpaces.find(vs => vs.id === props.id);
  const streams = createMemo(() => vs()?.tentsInSpace.filter((ent) => ent.entityType === 'stream' ).reverse() || []);

  const handleClick = (ent: MultEnt) => {
    if (props.clickAct === 'focus') {
      writerTargetID() === ent.refID
        ? setFocusedEntity(ent)
        : setWriterTargetID(ent.refID);
    } else {
      !openFloaters.includes(ent) &&
        setOpenFloaters(prev => [...prev, ent]);
    }
  };

createEffect(() => {
    const currentFocus = focusedEntity();
    
    // Only attempt to scroll if the focused entity is actually a stream
    if (currentFocus && currentFocus.entityType === 'stream') {
      const btnId = 'stream' + currentFocus.refID.toString();
      
      requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const targetBtn = document.getElementById(btnId);
          if (targetBtn) {
            targetBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
        });
      });
    }
  });
  return (
    <div class="lister-box">
      <div class='lister-header'>
        ViewSpace Streams
      </div>
      <div class="lister-list">
        <Show when=
          {(userMode() === 'ReadWrite'
            || userMode() === 'FocusWrite') && writerTargetID()}>
          <button
          id='null-btn'
          onClick={() => setWriterTargetID(null)}
          classList={{
            ['null-btn']: true,
            [`targeted-stream-btn`]:
              props.clickAct === 'focus' && !writerTargetID(),
          }}>
          Flash Out of Stream
        </button>
        </Show>
        <For each={streams()}>
          {(s) => (
        <button
          id={'stream' +
            s.refID.toString()}
          onClick={() => handleClick(s)}
          classList={{
            ['stream-btn']: s.refID !== 0,
            [`focused-stream-btn`]:
              props.clickAct === 'focus' && focusedEntity() === s,
            [`targeted-stream-btn`]:
              props.clickAct === 'focus' && writerTargetID() === s.refID,
            [`opened-stream-btn`]:
              props.clickAct === 'multi' && openFloaters.includes(s)
          }}>
          {getStream(s.refID)?.title}
        </button>
          )}
        </For>
      </div>
    </div>
      );
}
