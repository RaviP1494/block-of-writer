import { type Component, For } from "solid-js";
import { sparkChains, focusedChainID, setFocusedChainID, createNewChain } from "../store";

interface ChainListProps {
  clickDo: string;
};
export const ChainList: Component<ChainListProps> = (props) => {

  const handleClick = (chainID: number) => {
    if (props.clickDo === 'focus'){
      focusedChainID() ?
        setFocusedChainID(0) :
        setFocusedChainID(chainID);
    }
  }

  return (
    <div class="streamlist-box">
    <div class="streamlist">
    <For each={sparkChains}>
    {(chain) => {
      return (
      <button class="streambtn"
      id={'spark' + chain.id.toString()}
      onClick={() => {handleClick(chain.id)}}
      style={{
        'background-color' 
          : chain.id === focusedChainID() 
          ? '#0040ff' 
          : '#408080',
      }}>
        {chain.title}:{chain.sparkIDs.length}
      </button>
    )}}
    </For>
      </div>
      <button onClick={() => createNewChain()}>
      New Chain
      </button>
    </div>
  );
};
