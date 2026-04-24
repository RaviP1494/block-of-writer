import { createSignal, For, Show, type Component } from 'solid-js'
import { activeViewSpaceID, allStreams, chainTargetID, createNewChain, createNewStream, focusedChainID, focusedStreamID, openChains, openStreams, setChainTargetID, setFocusedChainID, setFocusedStreamID, setOpenChains, setOpenStreams, setWriterTargetID, sparkChains, viewSpaces, writerTargetID } from '../store';

interface SelectCollectionProps {
  of: string;
  clickAct: string;
};
export const SelectCollection: Component<SelectCollectionProps> = (props) => {
  const [createName, setCreateName] = createSignal('');

  const collection = 
    () => props.of === 'all-chains' 
      ? sparkChains 
      : props.of === 'all-streams' 
        ? allStreams 
        : props.of === 'all-spaces' 
          ? viewSpaces 
          : [{id: 1, title: 'selectOver of null', contentIDs: [1]}];


  const handleClick = (id:number) => {
    if(props.of === 'streams'){
      if (props.clickAct === 'focus'){
        writerTargetID() === id 
        ? setFocusedStreamID(id)
        : setWriterTargetID(id);
      } else if (props.clickAct === 'multi'){
        !openStreams.includes(id) && 
          setOpenStreams(prev => [...prev, id]);
      }
    } else if(props.of === 'chains'){
      if(props.clickAct === 'focus'){
        chainTargetID() === id
        ? setFocusedChainID(id)
        : setChainTargetID(id);
      } else if (props.clickAct === 'multi'){
        !openChains.includes(id) &&
          setOpenChains(prev => [...prev, id]);
      }
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Construct the ID of the button we just clicked
        const btnId = (props.of === 'streams' ? 'stream' : 'chain') + id;
        const targetBtn = document.getElementById(btnId);
        
        if (targetBtn) {
          // Tell the exact button to scroll to the top ('start') of the visible window
          targetBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  const buttonClass = (btnID: number) => {
    if(props.of === 'streams') {
      if (props.clickAct === 'focus') {
        return focusedStreamID() === btnID
          ? 'focused-lister-btn'
          : writerTargetID() === btnID
            ? 'targeted-lister-btn'
            : 'lister-btn';
      } else if (props.clickAct === 'multi') {
        return openStreams.some(id => id === btnID)
          ? 'focused-lister-btn'
          : 'lister-btn';
      }
    } else if (props.of === 'chains') {
      if (props.clickAct === 'focus') {
        return focusedChainID() === btnID
          ? 'focused-lister-btn'
          : chainTargetID() === btnID
            ? 'targeted-lister-btn'
            : 'lister-btn';
      } else if (props.clickAct === 'multi') {
        return openChains.some(id => id === btnID)
          ? 'focused-lister-btn'
          : 'lister-btn';
      }
    }
  }

  return (
    <div class="lister-box"> 
      <div class="new-maker"> 
        <input type="text" placeholder="Name" value={createName()}
          onInput={(e) => setCreateName(e.currentTarget.value)}
          onKeyDown={(e) => {
            e.key === 'Enter'
              ? handleCreate()
              : null
          }}
        />
        <button onClick={() => handleCreate()}>
          New {props.of} </button>
      </div>
      <Show when={props.of === 'streams'}>
        <button style={{
          'background-color':
            writerTargetID() ? '#404040' : '#141414',
          'max-height': '4ch',
          width: '100%',
          'flex-shrink': '0'
        }}
          onClick={() => {
            handleClick(0);
          }}>
          Space
        </button>
      </Show>
      <div class="lister-list">
        <For each={props.of === 'streams' ? [...allStreams] : [...sparkChains]}>
          {(collection) => (
            <button
            id={(props.of === 'streams' ? 'stream' : 'chain') + 
              collection.id.toString()}
            onClick={() => { handleClick(collection.id) }}
            class={buttonClass(collection.id)}>
              {collection.title}
            </button>
          )}
        </For>
      </div>
    </div>
  );
};
