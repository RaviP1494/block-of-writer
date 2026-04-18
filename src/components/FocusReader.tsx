import { type Component, createMemo, createSignal, Show, For } from 'solid-js';
import { EditTitle } from './EditTitle';
import {
  allStreams, allFlickers, allFlashes, updateStreamTitle,
  activeViewSpaceID, viewSpaces, updateSpaceName,
  groupedFlashIDs, focusedStreamID
} from '../store';


export const FocusReader: Component = () => {
  const [showSecondaryOpts, setShowSecondaryOpts] = createSignal(false);
  const [flashSpacing, setFlashSpacing] = createSignal(false);
  const [showTimes, setShowTimes] = createSignal(false);
  const [flowUp, setFlowUp] = createSignal(false);
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);
  const stream = () => allStreams.find((stream) => stream.id === focusedStreamID());

  const groupedContent = createMemo(() => {
    let groups = [...groupedFlashIDs(focusedStreamID())];
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
          <div class='stream'>
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
  const FlashNode: Component<{ id: number; prevID: number | null }> = (props) => {
    const flash = () => allFlashes.find(f => f.id === props.id);

    return (
      <Show when={flash()}>
        <Show 
          when={showTimes()}
          fallback={
            <span class={flashSpacing() ? 'paragraph' : ''}
              title={(flash()!.tSpan / 1000).toString() + ' seconds'}>
              {flash()!.textContents}
            </span>
          }
        >
            <div style={{color: '#800000', 'text-align': 'center'}}>
              {(() => {
                if (!props.prevID) {
                  // First flash: Show absolute time
                  const d = new Date(flash()!.createDT);
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  const hours = pad(d.getHours() % 12);
                  const suffix = d.getHours() > 12 ? 'PM' : 'AM'
                  return `${hours}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${suffix}`;
                } else {
                  const prevFlash = allFlashes.find(f => f.id === props.prevID);
                  if (prevFlash) {
                    const prevEnd = prevFlash.createDT + prevFlash.tSpan;
                    const deltaMs = flash()!.createDT - prevEnd;
                    // Math.max prevents negative values if typing overlaps
                    const deltaSec = (Math.max(0, deltaMs) / 1000).toFixed(1);
                    return `+${deltaSec}s`;
                  }
                  return '';
                }
              })()}
            </div>
            <div
              class='paragraph flash'
              title={(flash()!.tSpan / 1000).toString() + ' seconds'}
              style={{ 'color': '#000000' }}>
              {flash()!.textContents}
            </div>
        </Show>
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
          onClick={() => {
            setFlashSpacing(true)
            setShowTimes(!showTimes())
            }}>Show Times</button>
          <button 
          onClick={()=>
            {setShowSecondaryOpts(true)}}>
            More Options</button>
          </div>
          <div style={{width: '100%'}} class={showSecondaryOpts() ? 'knuckle optset' : 'nail optset'}>
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
      <div class='stream'>
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
                  return <FlashNode id={flashID} prevID={prevID} />;
                }}
              </For>
            </div>
          )}
        </For>
      </div>
    </Show>
  );
};


