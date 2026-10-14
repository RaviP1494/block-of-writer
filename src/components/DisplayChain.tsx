import { type Component, createSignal, Show, For } from "solid-js";
import { 
  allFlickers, 
  chainTargetID, 
  deleteChain, 
  removeFromChain, 
  setChainTargetID, 
  setOpenChains, 
  sparkChains, 
  updateChainTitle,
  saveSparkChainToFile
} from "../store";
import { EditTitle } from "./EditTitle";
import { DisplayFlash } from "./DisplayFlash";

export interface DisplayChainProps {
  id: number;
}

export const DisplayChain: Component<DisplayChainProps> = (props) => {
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const [flashSpacing, setFlashSpacing] = createSignal(false);
  const [flowUp, setFlowUp] = createSignal(false);
  const [showTimes, setShowTimes] = createSignal(false);
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);

  const chain = () => sparkChains.find((chain) => chain.id === props.id);
  const isTargeted = () => chainTargetID() === props.id;

  const toggleTarget = () => {
    if (isTargeted()) {
      setChainTargetID(null);
    } else {
      setChainTargetID(props.id);
    }
  };

  const closeChain = () => {
    setOpenChains(prev => prev.filter(id => id !== props.id));
    if (isTargeted()) {
      setChainTargetID(null);
    }
  };

  return (
    <Show when={chain()}>
      <div 
        class='stream-box white-bg'
        style={{
          border: isTargeted() ? '2px solid #00ff7f' : '1px solid #c0c0c0',
          'box-shadow': isTargeted() ? '0 0 10px rgba(0, 255, 127, 0.3)' : 'none',
          transition: 'border 0.2s, box-shadow 0.2s',
          margin: '0.5rem 0'
        }}
      >
        <div class='stream-title'>
          <Show when={!isEditingTitle()}
            fallback={
              <EditTitle
                initialValue={chain()!.title}
                onSave={(title: string) => {
                  updateChainTitle(chain()!.id, title);
                  setIsEditingTitle(false);
                }}
                onCancel={() => setIsEditingTitle(false)} />
            }>

            <div
              class='flex-top-down'
              style={{
                position: 'relative'
              }}>
              <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', width: '100%' }}>
                <h1 style={{ margin: '0' }}>
                  {chain()?.title}
                </h1>
                <button
                  class="chain-target-btn"
                  onClick={toggleTarget}
                  style={{
                    background: isTargeted() ? '#00ff7f' : 'transparent',
                    color: isTargeted() ? '#000000' : '#00ff7f',
                    border: '1px solid #00ff7f',
                    'border-radius': '4px',
                    padding: '0.2rem 0.6rem',
                    cursor: 'pointer',
                    'font-size': '0.85rem',
                    'font-weight': 'bold'
                  }}
                >
                  {isTargeted() ? '🎯 Target' : 'Select Target'}
                </button>
              </div>

              <div class='tiny-fun flex-wide'>
                <button
                  class={flowUp() ? 'anim-flip-on' : 'anim-flip-off'}
                  onClick={() => {
                    setFlowUp(!flowUp())
                    setShowTimes(false)
                  }}>
                  🡇
                </button>
                <button
                  class={
                    showTimes() ? 'anim-spacing inactivated'
                      : flashSpacing() ? 'anim-spacing' : 'anim-spacing-off'}
                  onClick={() =>
                    setFlashSpacing(!flashSpacing())}>
                  ⟣⟢
                </button>
                <button
                  class={flowUp() ? 'anim-flip-off inactivated'
                    : showTimes() ? 'anim-flip-on' : 'anim-flip-off'}
                  onClick={() => {
                    setFlashSpacing(true)
                    setShowTimes(!showTimes())
                  }}>
                  ⏲
                </button>
              </div>
              <div onMouseLeave={() => setDeleteClicked(false)}
                class='display-top-box'
                style={{
                  border: deleteClicked() ? '1px dashed #003004' : 'none',
                  transition: 'border 0.5s ease'
                }}>
                <button style={{ position: 'absolute', left: '0px' }}
                  class='transparent'
                  onClick={() => setIsEditingTitle(true)}>
                  Rename
                </button>
                <button style={{ position: 'absolute', left: '70px' }}
                  class='transparent'
                  onClick={() => saveSparkChainToFile(chain()!.id)}
                  title="Save chain">
                  Save
                </button>
                <button style={{ position: 'absolute', left: '130px' }}
                  class='transparent'
                  onClick={closeChain}
                  title="Close chain">
                  Close
                </button>

                <button class={deleteClicked()
                  ? 'delete-reveal' : 'delete-hide'}
                  onClick={() =>
                    deleteClicked()
                      ? deleteChain(chain()!.id)
                      && setDeleteClicked(false)
                      : ''}
                >
                  Confirm?
                </button>
                <button
                  onClick={() => setDeleteClicked(true)}
                  class={deleteClicked() ?
                    'delete-hide' : 'delete-reveal'}>
                  X
                </button>
              </div>
            </div>
          </Show>
        </div>
        <br />
        <div class='stream-text'>
          <For each={chain()?.sparkIDs}>
            {(sparkID) => {
              if (sparkID > 0) {
                return (
                  <span style={{ display: 'inline-flex', 'align-items': 'center', margin: '0 2px' }}>
                    <DisplayFlash
                      id={sparkID}
                      showTimes={() => showTimes()}
                      isSpaced={() => flashSpacing()}
                      renderedBy='chain' 
                    />
                    <button
                      onClick={() => removeFromChain(chain()!.id, sparkID)}
                      title="Remove from chain"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#a00000',
                        cursor: 'pointer',
                        'font-size': '0.75rem',
                        padding: '0 2px'
                      }}
                    >×</button>
                  </span>
                );
              } else {
                const flicker = allFlickers.find(f => f.id === sparkID);
                return (
                  <span style={{ display: 'inline-flex', 'align-items': 'center', margin: '0 2px', border: '1px dashed #c0c0c0', 'border-radius': '4px', padding: '2px' }}>
                    <For each={flicker?.contentIDs}>
                      {(flashID, index) => {
                        const prevID = index() > 0 ? flicker?.contentIDs[index() - 1] : null;
                        return (
                          <DisplayFlash 
                            id={flashID}
                            prevID={prevID}
                            showTimes={() => showTimes()}
                            isSpaced={() => flashSpacing()}
                            renderedBy='chain' 
                          />
                        );
                      }}
                    </For>
                    <button
                      onClick={() => removeFromChain(chain()!.id, sparkID)}
                      title="Remove flicker from chain"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#a00000',
                        cursor: 'pointer',
                        'font-size': '0.75rem',
                        padding: '0 2px'
                      }}
                    >×</button>
                  </span>
                );
              }
            }}
          </For>
        </div>
      </div>
    </Show>
  );
};
