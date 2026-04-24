import { createMemo, For, Show, type Component } from 'solid-js'
import { activeViewSpaceID, focusedEntity, getFlash, getFlickerTSpan, getStream, openFloaters, setFocusedEntity, setOpenFloaters, setWriterTargetID, textWordCount, viewSpaces, writerTargetID, type MultEnt } from '../store';

interface SelectItemProps {
  of: string;
  clickAct: string;
};
export const SelectItem: Component<SelectItemProps> = (props) => {
  const activeVS = () => viewSpaces.find(vs => vs.id === activeViewSpaceID());
  
  const collection = 
    createMemo(() => props.of === 'viewspace' 
      ?  activeVS()?.tentsInSpace 
      : props.of === 'space-floaters' 
        ? activeVS()?.tentsInSpace.filter(ent => ent.entityType !== 'stream') 
        : props.of === 'space-streams' 
          ? activeVS()?.tentsInSpace.filter(ent => ent.entityType === 'stream')
          : null);


  const handleClick = (ent:MultEnt) => {
    if(props.of === 'space-streams' && props.clickAct === 'focus'){
        writerTargetID() === ent.refID 
        ? setFocusedEntity(ent)
        : setWriterTargetID(ent.refID);
    } else if(props.clickAct === 'focus'){
      focusedEntity() !== ent &&
        setFocusedEntity(ent);
    } else if (props.clickAct === 'multi'){
      !openFloaters.includes(ent) &&
        setOpenFloaters(prev => [...prev, ent]);
    }

    if(focusedEntity() === ent)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const btnId = ent.entityType + ent.refID.toString();
        const targetBtn = document.getElementById(btnId);
        
        if (targetBtn) {
          // Tell the exact button to scroll to the top ('start') of the visible window
          targetBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  const buttonClass = 
    (ent: MultEnt) => {
    if (props.of === 'viewspace'){
      if (props.clickAct === 'focus') {
        return focusedEntity() === ent
          ? 'focused-' : '' + ent.entityType;
      }
      else if (props.clickAct === 'multi') {
        return openFloaters.some(e => e === ent) 
          ? 'opened-' : '' + ent.entityType;
      }
    }
  }


  const renderEntBtn = (ent: MultEnt) => {
    if(ent.entityType === 'stream') {
      return (
            <button
            id={'stream' + 
              ent.refID.toString()}
            onClick={() =>  handleClick(ent)}
            class={buttonClass(ent)}>
              {getStream(ent.refID)?.title}
            </button>
          );
    } else if(ent.entityType === 'flicker') {
      return (
            <button
            id={'flicker' + 
              ent.refID.toString()}
            onClick={() =>  handleClick(ent)}
            class={buttonClass(ent)}>
              {getFlickerTSpan(ent.refID).toString() + ' ' + ent.entityType}
            </button>
          );
    } else if(ent.entityType === 'flash') {
      return (
            <button
            id={'flash' + 
              ent.refID.toString()}
            onClick={() =>  handleClick(ent)}
            class={buttonClass(ent)}>
              {textWordCount(getFlash(ent.refID)?.textContents || 'many many many words').toString() + ' ' + ent.entityType}
            </button>
          );
    }
  }

  return (
    <div class="lister-box"> 
      <Show when={props.of === 'streams'}>
        <button style={{
          'background-color':
            writerTargetID() ? '#404040' : '#141414',
          'max-height': '4ch',
          width: '100%',
          'flex-shrink': '0'
        }}>
          Space
        </button>
      </Show>
      <div class="lister-list">
        <For each={collection()}>
          {(item) => renderEntBtn(item)}
        </For>
      </div>
    </div>
  );
};
