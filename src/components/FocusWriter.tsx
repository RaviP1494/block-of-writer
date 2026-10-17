import TimerWorker from '../workers/timerWorker?worker';
import { type Component, createSignal, onCleanup, Show } from 'solid-js';
import { spawnParticle, triggerDespawn, type PointTuple } from './AnimationOverlay';
import {
  type Flash, flashDelayT,
  flickerModeOn, flickerDelayT,
  backspaceDisabled, inflecTents,
  typingStartTime, setTypingStartTime,
  setIsFlickerOpen,
  inflectionOn,
  setInflectionOn,
  writerTargetID,
  addFlash,
  outFlect,
  focusedEntity,
  getStream,
  activeViewSpaceID,
  viewSpaces,
  textWordCount,
} from '../store';
import { spawnDots } from '../App';

export const [flashTimeLeft, setFlashTimeLeft] = createSignal(0);
export const [flickerTimeLeft, setFlickerTimeLeft] = createSignal(0);
export const [isActiveTimer, setIsActiveTimer] = createSignal(false);
export const [cursorIndex, setCursorIndex] = createSignal<number>(4);
export const [showTimeBars, setShowTimeBars] = createSignal<boolean>(true);
export const [hideTypedText, setHideTypedText] = createSignal<boolean>(false);

export const VALID_WRITER_KEYS: readonly string[] = [
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ...'0123456789',
  ' ', '.', ',', '!', '?', ';', ':', "'", '"', '-', '_',
  '(', ')', '[', ']', '{', '}', '/', '\\', '&', '@', '#',
  '$', '%', '^', '*', '+', '=', '<', '>', '~', '`', '|'
];

const spawnMyParticle = (timeSpan: number, text: string) => {
  const gravEls = document.querySelectorAll<HTMLElement>('.grav-pt');
  const gravPts: PointTuple[] = [];
  gravEls.forEach((el) => {
    const rect = el?.getBoundingClientRect();
    gravPts.push([(rect!.top + rect!.bottom) / 2, 
      (rect!.left + rect!.right) / 2]);
  });
  spawnParticle(gravPts, text, timeSpan);
};

// Example: Arcing it to the StreamList to destroy it
const killMyParticle = () => {
  const targetElement = focusedEntity()?.entityType === 'stream'
    ? document.querySelector('.stream-title h1')
    : writerTargetID()
    ? document.querySelector(`#stream${writerTargetID()}`)
    : document.querySelector('.floater-circles');
  const targetRect = targetElement ? targetElement.getBoundingClientRect() : document.querySelector('.welcomer')?.getBoundingClientRect();
  const target: PointTuple = 
    [(targetRect!.top + targetRect!.bottom) / 2, 
      (targetRect!.left + targetRect!.right) / 2];
    triggerDespawn(target);
}

const [currentText, setCurrentText] = createSignal("    ");

export const reclaimToWriter = (flashesText: string) => {
  setCurrentText((prev) => {
    const trimmed = prev.trim();
    return trimmed ? `    ${trimmed} ${flashesText} ` : `    ${flashesText} `;
  });
};

export const FocusWriter: Component = () => {

  let textareaRef: HTMLTextAreaElement | undefined;
  const worker = new TimerWorker();

  const syncCursorIndex = (el: HTMLTextAreaElement) => {
    setCursorIndex(el.selectionStart ?? 0);
  };


  worker.onmessage = (e) => {
    if (e.data.type === 'tick') {
      // Update our UI signals with the exact remaining milliseconds
      setFlashTimeLeft(e.data.flashRemaining);
      setFlickerTimeLeft(e.data.flickerRemaining);
    } else if (e.data.type === 'flash_timeout') {
      initFlash();
    } else if (e.data.type === 'flicker_timeout') {
      if(spawnDots()) killMyParticle();
      setIsFlickerOpen(false)
      !inflectionOn() && outFlect();
      setIsActiveTimer(false);
    }
  };

  onCleanup(() => {
    if (inflecTents() && inflecTents()!.length > 0) outFlect();
    worker.terminate();
  });

  const initFlash = () => {
    const text = currentText().trim();
    if (!text) return;

    const now = Date.now();
    const start = typingStartTime() || now;
    const delayT = flashDelayT() * 1000;

    const newFlash: Flash = {
      id: 0,
      createDT: now,
      textContents: text,
      tSpan: now - start,
      delayTSpan: delayT
    };
    setFlashTimeLeft(0);
    addFlash(newFlash);
    if (text && spawnDots()) spawnMyParticle((now-start)/1000, text);
    setCurrentText("    ");
    setCursorIndex(4);
    setTypingStartTime(null);
    worker.postMessage({ type: 'stop_flash' });
    if (!flickerModeOn()) setIsActiveTimer(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      if (e.key.toLowerCase() === 'v') e.preventDefault();
      return;
    }
    const text = currentText();
    if (backspaceDisabled() && e.key === 'Backspace') {
      e.preventDefault();
      if (text.trim().length > 0) initFlash();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (text.trim()) {
        initFlash();
        if (flickerModeOn()) setIsActiveTimer(true);
      } else if (inflecTents()) {
        if(spawnDots()) killMyParticle();
        outFlect();
        setTypingStartTime(null);
        worker.postMessage({
          type: 'stop',
        });
        setIsActiveTimer(false);
        setFlickerTimeLeft(0);
      } else {
        setTypingStartTime(null);
        worker.postMessage({
          type: 'stop',
        });
        setIsActiveTimer(false);
      }
      return;
    }
    if (!VALID_WRITER_KEYS.includes(e.key)) return;
    if (!typingStartTime()) {
      setTypingStartTime(Date.now());
      setIsActiveTimer(true);
    }
    worker.postMessage({
      type: 'reset',
      flashDelay: flashDelayT() * 1000,
      flickerDelay: flickerDelayT() * 1000
    });
  };

  // createEffect(() => {
  //   if (textareaRef) {
  //     textareaRef.style.height = 'auto';
  //     textareaRef.style.height = textareaRef.scrollHeight + 'px';
  //     window.scrollTo({
  //       top: document.documentElement.scrollHeight,
  //       behavior: 'auto'
  //     });
  //   }
  // });
  const flashProgress = () => {
    const total = flashDelayT() * 1000;
    return total > 0 && isActiveTimer()
      ? Math.max(0, Math.min(1, flashTimeLeft() / total))
      : 0;
  };

  const flickerProgress = () => {
    const total = flickerDelayT() * 1000;
    return total > 0 && isActiveTimer() && flickerModeOn()
      ? Math.max(0, Math.min(1, flickerTimeLeft() / total))
      : 0;
  };

  const targetLabel = () => {
    const streamId = writerTargetID();
    if (streamId !== null) {
      const s = getStream(streamId);
      return s ? `Stream: ${s.title}` : 'Stream';
    }
    const vs = viewSpaces.find((v) => v.id === activeViewSpaceID());
    return vs ? `Space: ${vs.title} (Loose)` : 'Loose in Space';
  };

  return (
    <div
      data-timer-active={isActiveTimer() ? 'true' : 'false'}
      class='focus-writer'
      style={{
        '--flash-pct': `${(flashProgress() * 100).toFixed(1)}%`,
        '--flicker-pct': `${(flickerProgress() * 100).toFixed(1)}%`,
      }}
    >
      <div class="focus-writer__meta">
        <div class="focus-writer__toggles" role="group" aria-label="Writer view toggles">
          <button
            type="button"
            class="focus-writer__toggle-btn"
            aria-pressed={hideTypedText()}
            onClick={() => {
              setHideTypedText((prev) => !prev);
              textareaRef?.focus();
            }}
          >
          Invisible Ink
          </button>
          <button
            type="button"
            class="focus-writer__toggle-btn"
            aria-pressed={showTimeBars()}
            onClick={() => {
              setShowTimeBars((prev) => !prev);
              textareaRef?.focus();
            }}
          >
          {showTimeBars() ? 'Time Bars' : 'Time Bars'}
          </button>
          <button
            type="button"
            class="focus-writer__toggle-btn"
            aria-pressed={inflectionOn()}
            onClick={() => {
              setInflectionOn((prev) => !prev);
              textareaRef?.focus();
            }}
          >
            Inflection
          </button>
        </div>

        <span class="focus-writer__target-badge">{targetLabel()}</span>

        <span class="focus-writer__stats">
          {textWordCount(currentText())}w
          <Show when={backspaceDisabled()}>
            <span class="focus-writer__lock-badge" title="Backspace triggers Flash">
              No-BS
            </span>
          </Show>
        </span>
      </div>
        <div class="focus-writer__surface">
          <textarea
            ref={textareaRef}
            class="writers-block"
            classList={{ 'writers-block--hidden-text': hideTypedText() }}
            aria-label="Writers Block Flash Input"
            spellcheck={false}
            autocorrect="off"
            autocapitalize="off"
            value={currentText()}
            onInput={(e) => {
              setCurrentText(e.currentTarget.value);
              syncCursorIndex(e.currentTarget);
            }}
            onKeyUp={(e) => syncCursorIndex(e.currentTarget)}
            onClick={(e) => syncCursorIndex(e.currentTarget)}
            onSelect={(e) => syncCursorIndex(e.currentTarget)}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onKeyDown={(e) => { handleKeyDown(e) }}
            placeholder="Begin a flash..."
            autofocus
          />

          <Show when={showTimeBars()}>
            <div class="focus-writer__timers" aria-hidden="true">
              <div class="focus-writer__timer-bar focus-writer__timer-bar--flash" />
              <Show when={flickerModeOn()}>
                <div class="focus-writer__timer-bar focus-writer__timer-bar--flicker" />
              </Show>
            </div>
          </Show>
        </div>
    </div>
  );
};
