import { type Component, createMemo, createSignal, Show, For } from 'solid-js';
import { EditTitle } from './EditTitle';
import {
  allStreams, allFlickers, allFlashes, updateStreamTitle,
  activeViewSpaceID, viewSpaces, updateSpaceName,
  groupedFlashIDs, focusedStreamID
} from '../store';


export const FocusReader: Component = () => {
  const [showSecondaryOpts, setShowSecondaryOpts] = createSignal(false);
  const [flickerSpacing, setFlickerSpacing] = createSignal(false);
  const [flashSpacing, setFlashSpacing] = createSignal(false);
  const [flowUp, setFlowUp] = createSignal(false);
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);
  const stream = () => allStreams.find((stream) => stream.id === focusedStreamID());

  const groupedContent = createMemo(() => {
    let groups = [...groupedFlashIDs(focusedStreamID())];
    if (flowUp()) {
      groups.reverse();
      groups = groups.map(group => {
        if (group.type === 'flashes' && flashSpacing()) {
          return { ...group, flashIDs: [...group.flashIDs].reverse() };
        }
        if (group.type === 'flicker') {
          return { ...group, flashIDs: [...group.flashIDs].reverse() };
        }
        return group;
      });
    }
    return groups;
  });

  const flickerFlashIDs = (id: number) => {
    const flashIDs = allFlickers.find(f => f.id === id)?.contentIDs;
    if (!flashIDs) return [];
    return flowUp() && flashSpacing() ? flashIDs.reverse() : flashIDs;
  }

  const renderSpace = () => {
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
                  return (<div class='solo-flicker'>
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

  return (
    <Show when={focusedStreamID() !== 0}
    fallback={renderSpace()}>
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
          <div
          style={{
            display: 'flex',
            'flex-direction': 'row',
            'justify-content': 'space-between',
          position: 'relative'}}>
          <div style={{width: '100%'}}
          class={showSecondaryOpts() ? 'nail optset' : 'knuckle optset'}>
          <button onClick={()=>setFlowUp(!flowUp())}>Reverse Order</button>
          <button 
          onClick={()=>
            setFlashSpacing(!flashSpacing())}>
          Flash Spacing
          </button>
          <button 
          onClick={()=>
            setFlickerSpacing(!flickerSpacing())}>
          Flicker Spacing
          </button>
          <button 
          onClick={()=>
            {setShowSecondaryOpts(true)}}>
            Upcoming Options</button>
          </div>
          <div style={{width: '100%'}} class={showSecondaryOpts() ? 'knuckle optset' : 'nail optset'}>
          <button>Show Times</button>
          <button 
          onClick={()=>{
            setShowSecondaryOpts(false)}}>
            Working Options </button>
          </div>
          </div>
          <h1 onClick={() => setIsEditingTitle(true)}>
            {stream()?.title}
          </h1>
        </Show>
      </div>
      <div 
      class='stream'>
        <For each={groupedContent()}>
          {(group) => (
            <span
            class={
              group.type === 'flashes'
                ? 'flash paragraph' 
                : 'flicker paragraph'}>
              <For each={group.flashIDs}>
                {(flashID) => (
                  <span class={flashSpacing() ? 'paragraph' : ''}>{
                    allFlashes.find(f => f.id === flashID)?.textContents || ''}
                  </span>
                )}
              </For>
            </span>
          )}
        </For>
      </div>
    </Show>
  );
};


