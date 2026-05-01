import { type Component, Show, createSignal, Match, Switch } from 'solid-js';
import { allFlashes, allFlickers, deleteFlash, openFloaters, setFocusedEntity, setOpenFloaters, type MultEnt } from '../store';
import { DisplayFlash } from './DisplayFlash';

interface FloaterFlashProps {
  id: number;
  clickSource?: MultEnt;
  innerClickMode?: string;
}

export const FloaterFlash: Component<FloaterFlashProps> = (props) => {
  const [bg, setBG] = createSignal(true);
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const holdingFlicker = allFlickers.find(f => f.contentIDs.includes(props.id));

  const flash = () => allFlashes.find(f => f.id === props.id);


  const handleMinimize = () => {
    props.innerClickMode === 'multi'
      ? setOpenFloaters(
        () => [...openFloaters.filter(
          ent => ent.entityType === 'flicker' && ent.refID === props.id)])
      : holdingFlicker 
        ? setFocusedEntity({entityType: 'flicker', refID: holdingFlicker.id}) 
        : setFocusedEntity(null);
  }

  const handleDelete = () => {
    handleMinimize();
    deleteFlash(flash()!.id);
  }

  return (
    <Show when={flash()}>
    <div class={bg() ? 'floater-flash white-bg' : 'floater-flash parchment-bg'}>
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
            </div>

            <Switch>
              <Match when={props.innerClickMode === 'focus'}>
                <div onMouseLeave={() => setDeleteClicked(false)}
                  class='display-top-box'
                  style={{
                    border: deleteClicked() ? '1px dashed #003004' : 'none',
                    transition: 'border 0.5s ease'
                  }}>
                  <button class={deleteClicked()
                    ? 'delete-reveal' : 'delete-hide'}
                    onClick={() =>
                      deleteClicked()
                        ? handleDelete() 
                        : ''}
                  >
                    Confirm?
                  </button>
                  <button
                    class={deleteClicked() ?
                      'delete-hide' : 'delete-reveal'}
                    style={{ 'background-color': '#ff8000', right: '20px' }}
                    onClick={() => handleMinimize()}>
                    -
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

        <div class='stream-text'>
      <DisplayFlash id={props.id}
      showTimes={() => false}
      isSpaced={() => true} 
      renderedBy='flash'
      />;
    </div>

    </div>
    </Show>
  );
};
