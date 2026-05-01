import { type Component, Show, For, createSignal } from 'solid-js';
import { allFlickers, allStreams, deleteFlicker, getFlickerTSpan, makeStreamFrom, openFloaters, setFocusedEntity, setOpenFloaters, viewSpaces } from '../store';
import { DisplayFlash } from './DisplayFlash';

interface FloaterFlashProps {
  id: number;
  innerClickMode?: string;
}

export const FloaterFlicker: Component<FloaterFlashProps> = (props) => {
  const flicker = () => allFlickers.find(f => f.id === props.id);
  const createDateTime = () => new Date(flicker()!.createDT);
  const heldBy =
    () => allStreams.find(s =>
      s.contentIDs
        .includes(props.id))?.title
      || viewSpaces.find(vs =>
        vs.tentsInSpace.some( ent =>
            ent.entityType === 'flicker' &&
            ent.refID === props.id
          ))
        ?.title;

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

  const handleDelete = 
    () => deleteFlicker(flicker()!.id) && handleMinimize();

  return (
    <Show when={flicker()}>
      <div class={bg() ? 'floater-flicker white-bg' : 'floater-flicker parchment-bg'}>
        <div class='stream-title'>
        <div onMouseLeave={() => setDeleteClicked(false)}
                  class='display-top-box flex-wide'
                  style={{
                    border: deleteClicked() ? '1px dashed #003004' : 'none',
                    transition: 'border 0.5s ease'
                  }}>
                  <div>
                <button
                title='"Seed" New Stream with Copy'
                onClick={
                  () => makeStreamFrom({entityType: 'flicker', refID: flicker()!.id})
                }>
                ⚵
                </button>
                <button title='Start Chain (coming soon..)'>☍</button>
                </div>
                  <h3 style={{
                    position: 'absolute', 
                    inset: 0, 
                    margin: 'auto'}}>
                    Flicker
                  </h3>
                  <div>
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
                </div>
                <div class='reader-stats'>
                <span>{createDateTime().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</span>
                <span>{heldBy()}</span>
                <span>{(getFlickerTSpan(flicker()!.id) / 1000).toFixed(1)}s</span>
                </div>
          <div
            class='flex-top-down'
            style={{
              position: 'relative'
            }}>
            <div class='tiny-fun flex-wide'>
              <button
                title='Change Background'
                onClick={() => setBG(p => !p)}
              >
                ⬚
              </button>
              <button
                class={flowUp() ? 'anim-flip-on' : 'anim-flip-off'}
                title='Flip Order'
                onClick={() => {
                  setFlowUp(!flowUp())
                  setShowTimes(false)
                }}>
                🡇
              </button>
              <button
                title='Toggle Spacing'
                class={
                  showTimes() ? 'anim-spacing inactivated'
                    : flashSpacing() ? 'anim-spacing' : 'anim-spacing-off'}
                onClick={() =>
                  setFlashSpacing(!flashSpacing())}>
                ⟣⟢
              </button>
              <button
                title='Toggle Timestamps'
                class={flowUp() ? 'anim-flip-off inactivated'
                  : showTimes() ? 'anim-flip-on' : 'anim-flip-off'}
                onClick={() => {
                  setFlashSpacing(true)
                  setShowTimes(!showTimes())
                }}>
                ⏲
              </button>
            </div>

          </div>
        </div>
        <div class='stream-text'>
        <For each={flicker()!.contentIDs}>
          {(flashID, index) => {
            const prevID = index() > 0 ? flicker()!.contentIDs[index() - 1] : null;
            return <DisplayFlash id={flashID}
              prevID={prevID}
              showTimes={() => showTimes()}
              isSpaced={() => flashSpacing()}
              renderedBy='flicker'
              clickDo={props.innerClickMode}
              />;
          }}
        </For>
          </div>
      </div>
    </Show>
  );
};
