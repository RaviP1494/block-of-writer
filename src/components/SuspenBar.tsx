import { type Component, For, Show } from 'solid-js';
import {
  suspenBarTents,
  setSuspenBarTents,
  sendToViewSpace,
  viewSpaces,
  setViewSpaces,
  activeViewSpaceID,
  getStream,
  getFlash,
  getFlicker,
  textWordCount,
  flickerWordCount,
  userMode,
  setUserMode,
  setWriterTargetID,
  setFocusedEntity,
  setFocusedStreamID,
  setOpenFloaters,
  type MultEnt,
} from '../store';

export const SuspenBar: Component = () => {
  const getLabel = (ent: MultEnt) => {
    if (ent.entityType === 'stream') {
      return getStream(ent.refID)?.title || `Stream ${ent.refID}`;
    }
    if (ent.entityType === 'flicker') {
      const f = getFlicker(ent.refID);
      return `Flicker (${flickerWordCount(f.id) || 0}w)`;
    }
    const fl = getFlash(ent.refID);
    return `Flash (${textWordCount(fl.textContents)}w)`;
  };

  const handleInspect = (ent: MultEnt) => {
    if (userMode() === 'Write') {
      if (ent.entityType === 'stream') {
        setWriterTargetID(ent.refID);
      }
      setOpenFloaters((prev) =>
        prev.some((e) => e.entityType === ent.entityType && e.refID === ent.refID)
          ? prev
          : [...prev, { entityType: ent.entityType, refID: ent.refID }]
      );
    } else {
      if (ent.entityType === 'stream') setFocusedStreamID(ent.refID);
      setFocusedEntity({ entityType: ent.entityType, refID: ent.refID });
      setUserMode('Read');
    }
  };

  const handleDropToActiveSpace = (ent: MultEnt, index: number) => {
    const targetVS = activeViewSpaceID();
    const alreadyInTarget = viewSpaces
      .find((vs) => vs.id === targetVS)
      ?.tentsInSpace.some(
        (e) => e.entityType === ent.entityType && e.refID === ent.refID
      );

    if (!alreadyInTarget) {
      // Remove from previous ViewSpaces so moving across ViewSpaces doesn't duplicate
      setViewSpaces(
        (vs) => vs.id !== targetVS && vs.tentsInSpace.length > 0,
        'tentsInSpace',
        (prev) =>
          prev.filter(
            (e) => !(e.entityType === ent.entityType && e.refID === ent.refID)
          )
      );
      sendToViewSpace(ent.entityType, ent.refID);
    }

    setSuspenBarTents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemove = (index: number) => {
    setSuspenBarTents((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div class="wb-suspen-inner">
      <span class="wb-suspen-label" title="Suspended items in transit">
        ↯ Suspension ({suspenBarTents.length})
      </span>

      <Show
        when={suspenBarTents.length > 0}
        fallback={<span class="wb-suspen-empty">Dock empty</span>}
      >
        <div class="wb-suspen-track">
          <For each={suspenBarTents}>
            {(ent, index) => (
              <div class="wb-suspen-pill" data-ent-type={ent.entityType}>
                <button
                  type="button"
                  class="wb-suspen-pill__main"
                  onClick={() => handleInspect(ent)}
                  title="Inspect or target item"
                >
                  {getLabel(ent)}
                </button>
                <button
                  type="button"
                  class="wb-suspen-pill__action"
                  onClick={() => handleDropToActiveSpace(ent, index())}
                  title="Move into active ViewSpace"
                >
                  ⊕
                </button>
                <button
                  type="button"
                  class="wb-suspen-pill__action wb-suspen-pill__action--remove"
                  onClick={() => handleRemove(index())}
                  title="Remove from Suspension Bar"
                >
                  ×
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};
