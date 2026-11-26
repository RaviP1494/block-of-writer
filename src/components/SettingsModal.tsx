import { type Component, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import {
  inflectionOn,
  setInflectionOn,
  flickerModeOn,
  setFlickerModeOn,
  flashDelayT,
  setFlashDelayT,
  flickerDelayT,
  setFlickerDelayT,
  backspaceDisabled,
  setBackspaceDisabled,
  inflecTents,
  outFlect,
} from '../store';
import {
  isActiveTimer,
  hideTypedText,
  setHideTypedText,
  showTimeBars,
  setShowTimeBars,
} from './FocusWriter';

export interface SettingsModalProps {
  isOpen: () => boolean;
  onClose: () => void;
}

export const SettingsModal: Component<SettingsModalProps> = (props) => {
  const [timersOpen, setTimersOpen] = createSignal(false);

  createEffect(() => {
    if (!props.isOpen()) {
      setTimersOpen(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        props.onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  const handleDelayChange = (timer: 'flash' | 'flicker', increment: boolean) => {
    if (isActiveTimer()) return;

    if (timer === 'flash') {
      setFlashDelayT((prev) => {
        if (increment) {
          const next = Number((prev + 0.5).toFixed(1));
          return flickerModeOn() ? (next < flickerDelayT() ? next : prev) : next;
        }
        return prev > 0.5 ? Number((prev - 0.5).toFixed(1)) : prev;
      });
    } else {
      setFlickerDelayT((prev) => {
        if (!increment) {
          const next = Number((prev - 0.5).toFixed(1));
          return next > flashDelayT() ? next : prev;
        }
        return Number((prev + 0.5).toFixed(1));
      });
    }
  };

  const handleToggleFlickerMode = () => {
    if (isActiveTimer()) return;
    if (inflecTents() && inflecTents()!.length > 0) outFlect();
    setFlickerModeOn((prev) => {
      const next = !prev;
      if (next && flickerDelayT() <= flashDelayT()) {
        setFlickerDelayT(Number((flashDelayT() + 1).toFixed(1)));
      }
      return next;
    });
  };

  const handleToggleInflection = () => {
    if (inflecTents() && inflecTents()!.length > 0) outFlect();
    setInflectionOn((prev) => !prev);
  };

  return (
    <Show when={props.isOpen()}>
      <div
        class="wb-modal-backdrop wb-modal-backdrop--settings"
        onClick={() => props.onClose()}
      >
        <div
          class="wb-settings-card"
          classList={{
            'wb-settings-card--timers-open': timersOpen(),
            'wb-settings-card--locked': isActiveTimer(),
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Writer Settings"
          onClick={(e) => e.stopPropagation()}
        >
          <div class="wb-settings-card__header">
            <h3 class="wb-modal-card__title">Settings</h3>
            <button
              type="button"
              class="stream-icon-btn"
              onClick={() => props.onClose()}
              title="Close Settings"
              aria-label="Close Settings"
            >
              ×
            </button>
          </div>

          <Show when={isActiveTimer()}>
            <div class="wb-settings-lock-note">
              Timer active — finish current flash to adjust delays.
            </div>
          </Show>

          <div
            class="wb-finger"
            classList={{
              'wb-finger--open': timersOpen(),
              'wb-finger--disabled': isActiveTimer(),
            }}
          >
            <button
              type="button"
              class="wb-knuckle"
              disabled={isActiveTimer()}
              onClick={() => setTimersOpen(true)}
            >
              Adjust Timers
            </button>

            <div class="wb-nail">
              <div class="wb-nail__top">
                <button
                  type="button"
                  class="focus-writer__toggle-btn"
                  aria-pressed={flickerModeOn()}
                  disabled={isActiveTimer()}
                  onClick={handleToggleFlickerMode}
                >
                  {flickerModeOn() ? 'Flicker On' : 'Flicker Off'}
                </button>
                <button
                  type="button"
                  class="stream-action-pill wb-nail__collapse"
                  onClick={() => setTimersOpen(false)}
                  title="Collapse timer controls"
                >
                  Done
                </button>
              </div>

              <div class="wb-delay-row">
                <span class="wb-delay-row__label">Flash Delay</span>
                <div class="wb-delay-stepper">
                  <button
                    type="button"
                    class="wb-delay-stepper__btn wb-delay-stepper__btn--minus"
                    disabled={isActiveTimer() || flashDelayT() <= 0.5}
                    onClick={() => handleDelayChange('flash', false)}
                    aria-label="Decrease Flash Delay"
                  >
                    −
                  </button>
                  <span class="wb-delay-stepper__val">{flashDelayT()}s</span>
                  <button
                    type="button"
                    class="wb-delay-stepper__btn wb-delay-stepper__btn--plus"
                    disabled={
                      isActiveTimer() ||
                      (flickerModeOn() && flashDelayT() + 0.5 >= flickerDelayT())
                    }
                    onClick={() => handleDelayChange('flash', true)}
                    aria-label="Increase Flash Delay"
                  >
                    +
                  </button>
                </div>
              </div>

              <Show when={flickerModeOn()}>
                <div class="wb-delay-row">
                  <span class="wb-delay-row__label">Flicker Delay</span>
                  <div class="wb-delay-stepper">
                    <button
                      type="button"
                      class="wb-delay-stepper__btn wb-delay-stepper__btn--minus"
                      disabled={isActiveTimer() || flickerDelayT() - 0.5 <= flashDelayT()}
                      onClick={() => handleDelayChange('flicker', false)}
                      aria-label="Decrease Flicker Delay"
                    >
                      −
                    </button>
                    <span class="wb-delay-stepper__val">{flickerDelayT()}s</span>
                    <button
                      type="button"
                      class="wb-delay-stepper__btn wb-delay-stepper__btn--plus"
                      disabled={isActiveTimer()}
                      onClick={() => handleDelayChange('flicker', true)}
                      aria-label="Increase Flicker Delay"
                    >
                      +
                    </button>
                  </div>
                </div>
              </Show>
            </div>
          </div>

          <div class="wb-settings-toggles">
            <label class="wb-settings-check">
              <input
                type="checkbox"
                checked={hideTypedText()}
                onChange={() => setHideTypedText((prev) => !prev)}
              />
              <span class="wb-settings-check__label">
                Invisible Ink
                <small>Hide typed glyphs while keeping the caret visible</small>
              </span>
            </label>

            <label class="wb-settings-check">
              <input
                type="checkbox"
                checked={showTimeBars()}
                onChange={() => setShowTimeBars((prev) => !prev)}
              />
              <span class="wb-settings-check__label">
                Time Bars
                <small>Show flash &amp; flicker countdown bars under the block</small>
              </span>
            </label>

            <label class="wb-settings-check">
              <input
                type="checkbox"
                checked={inflectionOn()}
                onChange={handleToggleInflection}
              />
              <span class="wb-settings-check__label">
                Inflection Point
                <small>Pause flashes in holding chamber before sending</small>
              </span>
            </label>

            <label class="wb-settings-check">
              <input
                type="checkbox"
                checked={backspaceDisabled()}
                onChange={() => setBackspaceDisabled((prev) => !prev)}
              />
              <span class="wb-settings-check__label">
                Disable Backspace
                <small>Backspace triggers Flash instead of deleting</small>
              </span>
            </label>
          </div>
        </div>
      </div>
    </Show>
  );
};
