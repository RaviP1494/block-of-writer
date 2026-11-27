import { type Component, Show, createEffect, onCleanup } from 'solid-js';

export interface HelpModalProps {
  isOpen: () => boolean;
  onClose: () => void;
}

export const HelpModal: Component<HelpModalProps> = (props) => {
  createEffect(() => {
    if (!props.isOpen()) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        props.onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  return (
    <Show when={props.isOpen()}>
      <div class="wb-modal-backdrop" onClick={() => props.onClose()}>
        <div
          class="wb-help-card"
          role="dialog"
          aria-modal="true"
          aria-label="About Writers Block"
          onClick={(e) => e.stopPropagation()}
        >
          <div class="wb-help-card__header">
            <h2 class="wb-help-card__title">Writers Block</h2>
            <button
              type="button"
              class="stream-icon-btn"
              onClick={() => props.onClose()}
              title="Close Help"
              aria-label="Close Help"
            >
              ×
            </button>
          </div>

          <div class="wb-help-card__body">
            <p class="wb-help-card__lead">
              This website is designed to be a tool to reduce friction in expression through writing.
            </p>
            <p>
              Here are the mechanics of the features for you to decide for yourself how you might use them:
            </p>

            <section class="wb-help-card__section">
              <p>
                In "Write" mode, there is the Writer's Block. It is a place to type into.
              </p>
              <p>
                When you type something, a timer is started (or restarted). When you stop typing for a certain number of seconds (that you can change in Settings), the text becomes a "Flash."
              </p>
              <p>
                The Flash is sent to your set Target (which can be either a Stream, or Free Space).
              </p>
              <p>
                Flashes made in succession are grouped into Flickers (which can be turned off in Timer Settings.)
              </p>
              <p>
                Inflection Point is a short stopping point for flashes and flickers to remain for you to reflect on the last thing you wrote, and can be turned off. When active, the last flash created can be brought back to continue/edit if you press backspace (or the Reclaim button).
              </p>
            </section>

            <section class="wb-help-card__section">
              <p>
                Streams can be created with the (+) button on the Bar above the Writers Block.
              </p>
              <p>
                Streams can be targeted by clicking on the button with their name. Clicking them again will open them below, and clicking on them a third time will Focus them in Review mode. Clicking on Write (in the navbar) will return you to Writers Block.
              </p>
              <p>
                In Review mode, you can Replay the stream to watch yourself typing the stream, including the things you erased and edited.
              </p>
              <p>
                Copying and Pasting is disabled in Writers Block.
              </p>
              <p>
                Streams and Free Flashes and Free Flickers are stored in Spaces. You can view/edit/create spaces by clicking on the button on the left side of the bar holding the Streams.
              </p>
              <p>
                Opened streams can be moved to Suspension, which you can then open when within another Space if you want to transfer Streams between Spaces.
              </p>
            </section>

            <section class="wb-help-card__section">
              <h3 class="wb-help-card__heading">In Settings, you can:</h3>
              <ul class="wb-help-card__list">
                <li>toggle Inflection Point On/Off</li>
                <li>toggle Disabling Backspace (if you want to force yourself to keep moving forward. It can.... take some getting used to.)</li>
                <li>toggle the Time Bars that signify the time left before triggering flash and flicker creations.</li>
              </ul>
              <p>
                You can Save and Load Streams, or entire Sessions to/from file in json format. To Save a stream, use the [↓] button. To save a session, use the Save button in the navbar. To load either, use the Load button in the navbar.
              </p>
            </section>

            <section class="wb-help-card__section">
              <h3 class="wb-help-card__heading">Upcoming features:</h3>
              <ul class="wb-help-card__list">
                <li>
                  Addressing a Stream's Contents: Traversing a stream, one flash at a time, choosing to make an action on each flash by a single letter/number press. Actions will include categorizing into "stracts," which will be collected copies of flashes that you can build (designed for categorizing related but distant flashes),
                </li>
                <li>
                  Visualizations of Writing: Models of Streams, Flickers, and Flashes that can express the granular properties of the writing in a form that makes them differentiable at a glance by values such as typing speed, deletions, etc. Also allows for alternative views of your writing that don't involve having the text itself visible, to distract from further expression/writing.
                </li>
              </ul>
            </section>

            <p class="wb-help-card__contact">
              For any suggestions or comments, please email me at{' '}
              <a href="mailto:rvkrnpl@gmail.com">rvkrnpl@gmail.com</a>.
            </p>
          </div>

          <div class="wb-help-card__footer">
            <button
              type="button"
              class="wb-navbar__btn wb-navbar__btn--active"
              onClick={() => props.onClose()}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
