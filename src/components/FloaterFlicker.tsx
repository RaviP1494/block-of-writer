import { type Component, Show, For, createSignal, Switch, Match } from 'solid-js';
import { allFlickers, deleteFlicker, openFloaters, setFocusedEntity, setOpenFloaters } from '../store';
import { DisplayFlash } from './DisplayFlash';

interface FloaterFlashProps {
  id: number;
  innerClickMode?: string;
}

export const FloaterFlicker: Component<FloaterFlashProps> = (props) => {
  const flicker = () => allFlickers.find(f => f.id === props.id);

  const [bg, setBG] = createSignal(true);
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const [flashSpacing, setFlashSpacing] = createSignal(false);
  const [showTimes, setShowTimes] = createSignal(false);
  const [flowUp, setFlowUp] = createSignal(false);

  const handleMinimize = () => {
    props.innerClickMode === 'multi'
      ? setOpenFloaters(
        () => [...openFloaters.filter(
          ent => ent.entityType === 'flicker' && ent.refID === props.id)])
      : setFocusedEntity(null);
  }

  return (
    <Show when={flicker()}>
      <div class={bg() ? 'floater-flicker white-bg' : 'floater-flicker parchment-bg'}>
        <div class='stream-title'>
          <div
            class='flex-top-down'
            style={{
              position: 'relative'
            }}>
            <div class='tiny-fun flex-wide'>
              <button
                onClick={() => setBG(p => !p)}
              >
                ⬚
              </button>
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

            <Switch>
              <Match when={props.innerClickMode === 'focus'}>
                <div onMouseLeave={() => setDeleteClicked(false)}
                  class='display-top-box'
                  style={{
                    border: deleteClicked() ? '1px dashed #003004' : 'none',
                    transition: 'border 0.5s ease'
                  }}>
                  <button
                    class='transparent'
                    style={{
                      width: 'fit-content',
                      position: 'absolute',
                      left: '0px'
                    }}
                    onClick={() => handleMinimize()}>
                    Hide
                  </button>
                  <button class={deleteClicked()
                    ? 'delete-reveal' : 'delete-hide'}
                    onClick={() =>
                      deleteClicked()
                        ? deleteFlicker(flicker()!.id)
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
              </Match>
              <Match when={props.innerClickMode === 'multi'}>
                <div class='display-top-box'>
                  <button
                    onClick={() => handleMinimize()}
                    class='delete-reveal'>
                    -
                  </button>
                </div>
              </Match>
            </Switch>
          </div>
        </div>
        <For each={flicker()!.contentIDs}>
          {(flashID, index) => {
            const prevID = index() > 0 ? flicker()!.contentIDs[index() - 1] : null;
            return <DisplayFlash id={flashID}
              prevID={prevID}
              showTimes={() => showTimes()}
              isSpaced={() => flashSpacing()} />;
          }}
        </For>
      </div>
    </Show>
  );
};
