import { type Component, Show, For } from 'solid-js';
import {
  setInflectionOn,
  inflecTents,
  setInflecTents,
  flickerModeOn,
  isFlickerOpen,
  setIsFlickerOpen,
  outFlect,
} from '../store';
import { reclaimToWriter } from './FocusWriter';

export const InflectionPoint: Component = () => {
  const handleReclaimLast = () => {
    const current = inflecTents();
    if (!current || current.length === 0) return;
    const last = current[current.length - 1];
    reclaimToWriter(last.textContents);
    const remaining = current.slice(0, -1);
    if (remaining.length === 0) {
      setInflecTents(null);
      setIsFlickerOpen(false);
    } else {
      setInflecTents(remaining);
    }
  };

  return (
    <div
      class="inflection"
      classList={{
        'inflection--flicker-open': flickerModeOn() && isFlickerOpen(),
        'inflection--flicker-ready': flickerModeOn() && !isFlickerOpen(),
      }}
    >
      <div class="inflection__header">
        <span class="inflection__title">
          Inflection Point
          <Show when={flickerModeOn() && isFlickerOpen()}>
            <span class="inflection__live-dot" title="Flicker grouping open" />
          </Show>
        </span>

        <div class="inflection__actions">
          <Show
            when={inflecTents() && inflecTents()!.length > 0}
            fallback={
              <button
                type="button"
                class="stream-action-pill"
                onClick={() => setInflectionOn(false)}
              >
                Close
              </button>
            }
          >
            <button
              type="button"
              class="stream-action-pill"
              onClick={handleReclaimLast}
              title="Bring the last flash back to the writer"
            >
              ↶ Reclaim
            </button>
            <button
              type="button"
              class="stream-action-pill"
              onClick={() => outFlect()}
              title="Send held flashes to target stream or space"
            >
              Send →
            </button>
          </Show>
        </div>
      </div>

      <Show
        when={inflecTents() && inflecTents()!.length > 0}
        fallback={
          <div class="inflection__empty">
            Holding chamber ready — flashes will pause here before entering the stream.
          </div>
        }
      >
        <div class="inflection__flashes">
          <For each={inflecTents()}>
            {(flash) => (
              <Show when={flash}>
                <div class="inflection__flash-item">{flash!.textContents}</div>
              </Show>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};
