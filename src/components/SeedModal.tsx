import { type Component, Show, batch, createEffect, createSignal } from 'solid-js';
import {
  seedSource,
  setSeedSource,
  makeStreamFrom,
  setUserMode,
  setWriterTargetID,
  getStream,
} from '../store';

export const SeedModal: Component = () => {
  const [streamName, setStreamName] = createSignal('');
  let inputRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (seedSource()) {
      setStreamName('');
      setTimeout(() => inputRef?.focus(), 20);
    }
  });

  const sourceDescription = () => {
    const src = seedSource();
    if (!src) return '';
    if (src.entityType === 'stream') {
      const title = getStream(src.refID)?.title || `Stream ${src.refID}`;
      return `Seed a new stream starting with a copy of "${title}"`;
    }
    if (src.entityType === 'flicker') {
      return 'Seed a new stream starting with a copy of this Flicker';
    }
    return 'Seed a new stream starting with a copy of this Flash';
  };

  const handleClose = () => {
    setSeedSource(null);
    setStreamName('');
  };

  const handleSubmit = () => {
    const src = seedSource();
    if (!src) return;

    const newStreamID = makeStreamFrom(src, streamName().trim());
    batch(() => {
      setSeedSource(null);
      setStreamName('');
      setUserMode('Write');
      if (newStreamID !== null) {
        setWriterTargetID(newStreamID);
      }
    });
  };

  return (
    <Show when={seedSource()}>
      <div class="wb-modal-backdrop" onClick={handleClose}>
        <div
          class="wb-modal-card"
          role="dialog"
          aria-modal="true"
          aria-label="Seed New Stream"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 class="wb-modal-card__title">Seed New Stream</h3>
          <p class="wb-modal-card__subtitle">{sourceDescription()}</p>
          <input
            ref={inputRef}
            type="text"
            class="wb-modal-card__input"
            placeholder="Stream name (leave blank for default)..."
            value={streamName()}
            onInput={(e) => setStreamName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') handleClose();
            }}
          />
          <div class="wb-modal-card__actions">
            <button
              type="button"
              class="wb-navbar__btn"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              class="wb-navbar__btn wb-navbar__btn--active"
              onClick={handleSubmit}
            >
              Seed &amp; Write
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
