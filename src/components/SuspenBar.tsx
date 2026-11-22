import { type Component, For, Show, batch, createSignal } from 'solid-js';
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
  setFocusedEntity,
  setFocusedStreamID,
  setOpenFloaters,
  deleteStream,
  deleteFlicker,
  deleteFlash,
  type MultEnt,
} from '../store';

const SuspenPill: Component<{
  ent: MultEnt;
  label: string;
  onOpen: () => void;
  onDelete: () => void;
}> = (props) => {
  const [confirmDelete, setConfirmDelete] = createSignal(false);

  return (
    <div
      class="wb-suspen-pill"
      classList={{ 'wb-suspen-pill--confirming': confirmDelete() }}
      data-ent-type={props.ent.entityType}
      onMouseLeave={() => setConfirmDelete(false)}
    >
      <button
        type="button"
        class="wb-suspen-pill__main"
        onClick={props.onOpen}
        title="Restore to active ViewSpace and open"
      >
        {props.label}
      </button>
      <Show
        when={!confirmDelete()}
        fallback={
          <button
            type="button"
            class="wb-suspen-pill__action wb-suspen-pill__action--confirm"
            onClick={() => {
              props.onDelete();
              setConfirmDelete(false);
            }}
            title="Confirm permanent deletion"
          >
            Confirm?
          </button>
        }
      >
        <button
          type="button"
          class="wb-suspen-pill__action wb-suspen-pill__action--remove"
          onClick={() => setConfirmDelete(true)}
          title="Delete item"
        >
          ×
        </button>
      </Show>
    </div>
  );
};

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

  const handleOpenFromSuspension = (ent: MultEnt) => {
    batch(() => {
      const targetVS = activeViewSpaceID();
      const alreadyInTarget = viewSpaces
        .find((vs) => vs.id === targetVS)
        ?.tentsInSpace.some(
          (e) => e.entityType === ent.entityType && e.refID === ent.refID
        );

      if (!alreadyInTarget) {
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

      setSuspenBarTents((prev) =>
        prev.filter(
          (e) => !(e.entityType === ent.entityType && e.refID === ent.refID)
        )
      );

      if (userMode() === 'Write') {
        setOpenFloaters((prev) =>
          prev.some((e) => e.entityType === ent.entityType && e.refID === ent.refID)
            ? prev
            : [...prev, { entityType: ent.entityType, refID: ent.refID }]
        );
      } else {
        if (ent.entityType === 'stream') setFocusedStreamID(ent.refID);
        setFocusedEntity({ entityType: ent.entityType, refID: ent.refID });
      }
    });

    if (userMode() === 'Write') {
      requestAnimationFrame(() => {
        const el = document.getElementById(`companion-${ent.entityType}-${ent.refID}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      });
    }
  };

  const handleDeleteFromSuspension = (ent: MultEnt) => {
    batch(() => {
      if (ent.entityType === 'stream') {
        deleteStream(ent.refID);
      } else if (ent.entityType === 'flicker') {
        deleteFlicker(ent.refID);
      } else {
        deleteFlash(ent.refID);
      }
      setSuspenBarTents((prev) =>
        prev.filter(
          (e) => !(e.entityType === ent.entityType && e.refID === ent.refID)
        )
      );
    });
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
            {(ent) => (
              <SuspenPill
                ent={ent}
                label={getLabel(ent)}
                onOpen={() => handleOpenFromSuspension(ent)}
                onDelete={() => handleDeleteFromSuspension(ent)}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};
