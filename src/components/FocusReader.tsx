import { type Component, createMemo, createSignal, Show, For } from 'solid-js';
import { focusedStreamID } from './FocusWriter';
import { EditTitle } from './EditTitle';
import { allStreams, allFlickers, allFlashes, updateStreamTitle,
  activeViewSpaceID, viewSpaces, updateSpaceName, type MultEnt} from '../store';


export const FocusReader: Component = () => {
  const [spaced, setSpaced] = createSignal(false);
  const [flowUp, setFlowUp] = createSignal(false);
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);
  const stream = () => allStreams.find((stream) => stream.id === focusedStreamID());
  

  const groupedContent = createMemo(() => {
    const ids = stream()?.contentIDs || [];
    const groups: Array<{ type: 'flashes' | 'flicker', flashIDs: number[]}> = [];
    let currentFlashGroup: number[] = [];
    ids.forEach(id => {
      if (id > 0) { 
        currentFlashGroup.push(id);
      } else {      
        if (currentFlashGroup.length > 0) {
          groups.push({ type: 'flashes', flashIDs: currentFlashGroup });
          currentFlashGroup = [];
        }
        const flicker = allFlickers.find(f => f.id === id);
        groups.push({ type: 'flicker', flashIDs: flicker ? flicker.contentIDs : [] });
      }
    });
    if (currentFlashGroup.length > 0) {
      groups.push({ type: 'flashes', flashIDs: currentFlashGroup });
    }
    return flowUp() ? groups.reverse() : groups;
  });

  const flickerFlashIDs = (id:number) => {
    const flashIDs = allFlickers.find(f => f.id === id)?.contentIDs;
    if (!flashIDs) return [];
    return flashIDs;
  }

  const renderFree = () => {
    const activeSpace = createMemo(() => viewSpaces.find(vs => vs.id === activeViewSpaceID()));
    const nonStreams = () => activeSpace()?.tentsInSpace?.filter((e) => e.entityType === 'flicker' || e.entityType === 'flash') || [];
    return !activeSpace() ? ('null space') 
      : (
      <Show when={activeSpace()}>
<div class='title-bar'>
        <Show 
        when={!isEditingTitle()} 
        fallback={
<EditTitle 
          initialValue={activeSpace()!.name ? activeSpace()!.name : 'null'} 
          onSave={(name: string) => { 
            updateSpaceName(activeSpace()!.id, name); 
            setIsEditingTitle(false); 
          }} 
          onCancel={() => setIsEditingTitle(false)} />
        }>
          <h1 onClick={() => setIsEditingTitle(true)}>
{activeSpace()?.name}
          </h1>
        </Show>
        </div>
<div class='space'>
          <For each={nonStreams()}>
            {(ent) => {
              if (ent.entityType === 'flash') {
return <div class='solo-flash'><span>{allFlashes.find(f => f.id === ent.refID)?.textContents || 'null'}</span></div>;
              } 
              
              if (ent.entityType === 'flicker') {
return ( <div class='solo-flicker'>
                  <For each={flickerFlashIDs(ent.refID)}>
                    {(flashID) => (
<span class='inner-flash'>{allFlashes.find(f => f.id === flashID)?.textContents || 'null'}</span>
                    )}
                  </For>
                  </div>
                );
              }

              return 'null space';
            }}
          </For>
        </div>
      </Show>
    );
  };

  if (!focusedStreamID()){
    return renderFree();
  } 
  return (
    <Show when={stream()}>
<div class='title-bar'>
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
    <h1 onClick={() => setIsEditingTitle(true)}>
{stream()?.title}
    </h1>
    </Show>
</div>
<div class='stream'>
    <For each={groupedContent()}>
    {(group) => (
<div class={group.type === 'flashes' ? 'string-of-flashes' : 'flicker-flashes'}>
      <For each={group.flashIDs}>
      {(flashID) => (
<span class='inner-flash'>{allFlashes.find(f => f.id === flashID)?.textContents || ''}</span>
      )}
      </For>
      </div>
    )}
    </For>
    </div>
    </Show>
  );
};


