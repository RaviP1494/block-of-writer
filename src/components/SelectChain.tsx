import { For, type Component } from 'solid-js'
import { chainTargetID, focusedChainID, openChains, setChainTargetID, setFocusedChainID, setOpenChains, sparkChains } from '../store';
import { CreateNew } from './CreateNew';

interface SelectChainProps {
  clickAct: string;
};
export const SelectChain: Component<SelectChainProps> = (props) => {


  const handleClick = (id:number) => {
      if(props.clickAct === 'focus'){
        chainTargetID() === id
        ? setFocusedChainID(id)
        : setChainTargetID(id);
      } else if (props.clickAct === 'multi'){
        openChains.includes(id) && focusedChainID() !== id 
          ? setFocusedChainID(id) 
          : !openChains.includes(id) 
          && setOpenChains(prev => [...prev, id]);
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Construct the ID of the button we just clicked
        const btnId = 'chain' + id;
        const targetBtn = document.getElementById(btnId);
        
        if (targetBtn) {
          // Tell the exact button to scroll to the top ('start') of the visible window
          targetBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  return (
    <div class="lister-box"> 
    <CreateNew of='chain' />
      <div class="lister-list">
        <For each={[...sparkChains]}>
          {(collection) => (
            <button
            id={'chain' + 
              collection.id.toString()}
            onClick={() => { handleClick(collection.id) }}
            classList={{
              ['chain-btn']: true,
              ['focused-chain-btn']: 
                props.clickAct === 'focus' && focusedChainID() === collection.id,
              [`targeted-chain-btn`]:
                props.clickAct === 'multi' && openChains.includes(collection.id),
            }}>
            {collection.title}
            </button>
          )}
        </For>
      </div>
    </div>
  );
};
