import { type Component, Show, createSignal } from 'solid-js';
import { allFlashes, allFlickers, allStreams, deleteFlash, makeStreamFrom, openFloaters, setFocusedEntity, setOpenFloaters, viewSpaces, type MultEnt } from '../store';
import { DisplayFlash } from './DisplayFlash';

interface FloaterFlashProps {
  id: number;
  clickSource?: MultEnt;
  innerClickMode?: string;
}

export const FloaterFlash: Component<FloaterFlashProps> = (props) => {
  const [bg, setBG] = createSignal(true);
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const holdingFlicker = allFlickers
  .find(f => 
        f.contentIDs.includes(props.id)
       ) || null;

  const flash = () => allFlashes.find(f => f.id === props.id);

  const createDateTime = new Date(flash()!.createDT);

  const heldBy = () => {
    const holdingStream = allStreams.find(s =>
      s.contentIDs
        .includes(holdingFlicker
          ? (holdingFlicker.id || props.id)
          : props.id));
    if (holdingStream) return holdingStream.title;
    const vs = holdingStream ? holdingStream
      : viewSpaces.find(vs =>
        vs.tentsInSpace.some( ent =>
              ent.entityType === (holdingFlicker ? 'flicker' : 'flash') &&
              ent.refID === (holdingFlicker ? holdingFlicker.id : props.id)
            ));
    return vs?.title;
  }

  const handleMinimize = () => {
    props.innerClickMode === 'multi'
      ? setOpenFloaters(
        () => [...openFloaters.filter(
          ent => ent.entityType === 'flicker' && ent.refID === props.id)])
      : holdingFlicker 
        ? setFocusedEntity({entityType: 'flicker', refID: holdingFlicker.id}) 
        : setFocusedEntity(null);
  }

  const handleDelete = 
    () => deleteFlash(flash()!.id) && handleMinimize();
  

  return (
    <Show when={flash()}>
      <div class={bg()
        ? 'floater-flash white-bg'
        : 'floater-flash parchment-bg'}>
        <div class='stream-title'>
          <div onMouseLeave={() => setDeleteClicked(false)}
            class='display-top-box'
            style={{
              border: deleteClicked() ? '1px dashed #003004' : 'none',
              transition: 'border 0.5s ease'
            }}>
                  <h3 style={{
                    position: 'absolute', 
                    inset: 0, 
                    margin: 'auto'}}>
                    Flash
                    </h3>
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
                <div class='reader-stats'>
                <span>{createDateTime.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</span>
                <span>{heldBy()}</span>
                <span>{(flash()!.tSpan / 1000).toFixed(1)}s</span>
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
                title='"Seed" New Stream with Copy'
                onClick={
                  () => makeStreamFrom({entityType: 'flash', refID: flash()!.id})
              }>⚵</button>
            <button title='Start Chain (coming soon..)'>☍</button>
          </div>
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
    </Show >
  );
};
