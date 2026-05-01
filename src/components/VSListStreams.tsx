import { createEffect, createMemo, For, type Component } from 'solid-js'
import { focusedEntity, focusedStreamID, getStream, openFloaters, setFocusedEntity, setFocusedStreamID, setOpenFloaters, setWriterTargetID, viewSpaces, writerTargetID, type MultEnt } from '../store';

interface VSListStreamsProps {
  id: number | null;
  clickAct: string;
};
export const VSListStreams: Component<VSListStreamsProps> = (props) => {

  if (!props.id) return (<div>no viewspace</div>)
  const vs = () => viewSpaces.find(vs => vs.id === props.id);
  const streams = createMemo(() =>
    vs()?.tentsInSpace.filter((ent) =>
      ent.entityType === 'stream')
      .reverse() || []);

  const handleClick = (ent: MultEnt) => {
    if(props.clickAct === 'focus'){
      writerTargetID() === ent.refID
        ? setFocusedStreamID(ent.refID)
        : setWriterTargetID(ent.refID);
      setFocusedEntity(null);
    }
    else if(props.clickAct === 'multi'){
      !openFloaters.includes(ent) 
      setOpenFloaters(prev => [...prev, ent]);
    }
  };

createEffect(() => {
    const currentFocus = focusedEntity();
    
    // Only attempt to scroll if the focused entity is actually a stream
    if (currentFocus && currentFocus.entityType === 'stream') {
      const btnId = 'stream' + currentFocus.refID.toString();
      const targetBtn = document.getElementById(btnId);
      if (targetBtn) {
        targetBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
  return (
    <div class="lister-box">
      <div class='lister-header'>
        <h4>Streams</h4>
      </div>
      <div class="lister-list">
        <For each={streams()}>
          {(s) => (
        <button
          id={'stream' +
            s.refID.toString()}
          onClick={() => handleClick(s)}
          classList={{
            ['stream-btn']: s.refID !== 0,
            [`focused-stream-btn`]:
              props.clickAct === 'focus' && focusedStreamID() === s.refID,
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
