import { type Component, createSignal, Show, For } from "solid-js";
import { allFlickers, deleteChain, sparkChains, updateChainTitle } from "../store";
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

  return (
    <Show when={chain()}>
      <div class='stream-box white-bg'>
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
              onClick={(e) => console.log(e)}
              style={{
                position: 'relative'
              }}>
              <h1>
                {chain()?.title}
              </h1>

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
                  <DisplayFlash
                    id={sparkID}
                    showTimes={() => showTimes()}
                    isSpaced={() => flashSpacing()}
                    renderedBy='chain' 
                  />);
              } else {
                const flicker = allFlickers.find(f => f.id === sparkID);
                return (
                  <For each={flicker?.contentIDs}>
                    {(flashID, index) => {
                      const prevID = index() > 0 ? flicker?.contentIDs[index() - 1] : null;
                      return <DisplayFlash id={flashID}
                        prevID={prevID}
                        showTimes={() => showTimes()}
                        isSpaced={() => flashSpacing()}
                        renderedBy='chain' />;
                    }}
                  </For>);
              }
            }}
          </For>
        </div>
      </div>
    </Show>
  );
};
